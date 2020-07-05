import {Command} from "./command/Command";
import {KEYTURNER_GDIO_CHARACTERISTIC, KEYTURNER_USDIO_CHARACTERISTIC, PAIRING_GDIO_CHARACTERISTIC} from "./Protocol";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {decryptCommand, encryptCommand} from "./CommandCrypto";
import {DecodingError} from "./command/DecodingError";
import {ERROR_BAD_CRC} from "./command/Constants";
import {ErrorCommand} from "./command/ErrorCommand";
import {StatusCommand} from "./command/StatusCommand";

export class CommandCentral {

    private authorizationId?: number;
    private sharedKey?: Buffer;

    constructor(private dataIoHandler: (data: Buffer, characteristicId: number, receive: (data: Buffer, characteristicId: number) => Promise<boolean>) => Promise<void>) {
    }

    setAuthorization(authorizationId?: number, sharedKey?: Buffer): void {
        this.authorizationId = authorizationId;
        this.sharedKey = sharedKey;
    }

    async executeCommand<R extends Command>(command: Command, characteristicId: number, resultClass: new () => R, receiveIntermediateCommand?: (command: Command) => void): Promise<R> {
        let data: Buffer;
        switch (characteristicId) {
            case PAIRING_GDIO_CHARACTERISTIC:
            case KEYTURNER_GDIO_CHARACTERISTIC:
                data = encodeCommand(command);
                break;
            case KEYTURNER_USDIO_CHARACTERISTIC:
                if (this.authorizationId === undefined || this.sharedKey === undefined) {
                    throw new Error("No authorization data configured");
                }
                data = encryptCommand(encodeCommand(command), this.authorizationId, this.sharedKey);
                break;
            default:
                throw new Error(`Unsupported characteristic ${characteristicId}`);
        }
        let receiveBuffer: Buffer|null = null;
        let receiveCharacteristic = -1;
        let receiveCommand: Command|null = null;
        await this.dataIoHandler(data, characteristicId, async (data, characteristicId) => {
            if (receiveBuffer === null) {
                // first fragment
                receiveBuffer = data;
                receiveCharacteristic = characteristicId;
            } else if (receiveCharacteristic !== characteristicId) {
                throw new Error(`Characteristic changed in fragment from ${receiveCharacteristic} to ${characteristicId}`);
            } else {
                receiveBuffer = Buffer.concat([receiveBuffer, data]);
            }

            switch (receiveCharacteristic) {
                case PAIRING_GDIO_CHARACTERISTIC:
                case KEYTURNER_GDIO_CHARACTERISTIC:
                    try {
                        receiveCommand = decodeCommand(receiveBuffer);
                        if (!receiveIntermediateCommand || receiveCommand instanceof resultClass || receiveCommand instanceof StatusCommand || receiveCommand instanceof ErrorCommand) {
                            return true;
                        }
                        receiveIntermediateCommand(receiveCommand);
                        receiveBuffer = null;
                        receiveCharacteristic = -1;
                        receiveCommand = null;
                        return false;
                    } catch (e) {
                        if (e instanceof DecodingError && e.code === ERROR_BAD_CRC) {
                            // TODO: how to detect when it is really broken and not just incomplete?
                            return false;
                        }
                        throw e;
                    }
                case KEYTURNER_USDIO_CHARACTERISTIC:
                    if (receiveBuffer.length < 30) {
                        return false;
                    }
                    const len = receiveBuffer.readUInt16LE(28) + 30;
                    if (receiveBuffer.length < len) {
                        return false;
                    }
                    const decrypted = decryptCommand(receiveBuffer.slice(0, len), () => this.sharedKey);
                    if (!decrypted) {
                        throw new Error("Decryption of response failed");
                    }
                    if (decrypted.authorizationId !== this.authorizationId) {
                        throw new Error("Invalid authorization id in response");
                    }
                    try {
                        receiveCommand = decodeCommand(decrypted.data, true);
                        return true;
                    } catch (e) {
                        console.log(e);
                        throw new Error("Decoding of response failed");
                    }
                default:
                    throw new Error(`Unsupported characteristic ${characteristicId}`);
            }
        });
        if (receiveCommand === null) {
            throw new Error("Unexpected error: missing receiveCommand");
        }
        if (!(receiveCommand as Command instanceof resultClass)) {
            throw receiveCommand;
        }

        return receiveCommand;
    }

}
