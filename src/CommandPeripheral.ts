import {Command} from "./command/Command";
import {
    KEYTURNER_GDIO_CHARACTERISTIC,
    KEYTURNER_USDIO_CHARACTERISTIC,
    PAIRING_GDIO_CHARACTERISTIC
} from "./Protocol";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {ErrorCommand} from "./command/ErrorCommand";
import {
    ERROR_UNKNOWN,
    K_ERROR_NOT_AUTHORIZED
} from "./command/Constants";
import {DecodingError} from "./command/DecodingError";
import {decryptCommand, encryptCommand} from "./CommandCrypto";

export type CommandHandler = (request: {command: Command, characteristicId: number, authorizationId?: number}, sendCommand: (command: Command) => Promise<void>) => Promise<Command|false>;

export class CommandPeripheral {

    constructor(private commandHandlers: CommandHandler[], private sharedSecretProvider: (authId: number) => Buffer|undefined) {
    }

    handleDataIo = async (data: Buffer, characteristicId: number, sendAsync: (data: Buffer, characteristicId: number) => Promise<void>, disconnect: () => void): Promise<void> => {
        if (characteristicId === PAIRING_GDIO_CHARACTERISTIC || characteristicId === KEYTURNER_GDIO_CHARACTERISTIC || characteristicId === KEYTURNER_USDIO_CHARACTERISTIC) {
            try {
                let skipCrc = false;
                let authorizationId: number|undefined;
                let sharedSecret: Buffer|undefined;

                if (characteristicId === KEYTURNER_USDIO_CHARACTERISTIC) {
                    try {
                        ({data, authorizationId, sharedSecret} = decryptCommand(data, this.sharedSecretProvider));
                        skipCrc = true;
                    } catch (e) {
                        console.log("Error decrypting command", data.toString("hex"), e);
                        await sendAsync(encodeCommand(new ErrorCommand(K_ERROR_NOT_AUTHORIZED, 0)), KEYTURNER_GDIO_CHARACTERISTIC);
                        return;
                    }
                }

                let command: Command;
                try {
                    command = decodeCommand(data, skipCrc);
                    console.log("received " + command.toString());
                } catch (e) {
                    console.log("Error decoding command", data.toString("hex"), e);
                    if (authorizationId !== undefined && sharedSecret) {
                        if (e instanceof DecodingError) {
                            await sendAsync(encryptCommand(encodeCommand(new ErrorCommand(e.code, e.commandId)), authorizationId, sharedSecret), characteristicId);
                        } else {
                            await sendAsync(encryptCommand(encodeCommand(new ErrorCommand(ERROR_UNKNOWN)), authorizationId, sharedSecret), characteristicId);
                        }
                    } else {
                        if (e instanceof DecodingError) {
                            await sendAsync(encodeCommand(new ErrorCommand(e.code, e.commandId)), characteristicId);
                        } else {
                            await sendAsync(encodeCommand(new ErrorCommand(ERROR_UNKNOWN)), characteristicId);
                        }
                    }
                    return;
                }

                let response: Command|false = false;
                try {
                    const sendCommand = async (command: Command): Promise<void> => {
                        console.log("sending " + command.toString());
                        try {
                            if (authorizationId !== undefined && sharedSecret) {
                                await sendAsync(encryptCommand(encodeCommand(command), authorizationId, sharedSecret), characteristicId);
                            } else {
                                await sendAsync(encodeCommand(command), characteristicId);
                            }
                        } catch (e) {
                            console.log("Error sending intermediate response, disconnecting", e);
                            disconnect();
                            throw sendCommand;
                        }
                    };

                    for (const commandHandler of this.commandHandlers) {
                        response = await commandHandler({
                            command,
                            characteristicId,
                            authorizationId
                        }, sendCommand);
                        if (response !== false) {
                            break;
                        }
                    }

                    if (response === false) {
                        throw new Error("Unhandled command: " + command.toString());
                    }
                } catch (e) {
                    if (e === sendAsync) {
                        // error already handled
                        return;
                    }
                    console.log("Error executing command", e);
                    if (authorizationId !== undefined && sharedSecret) {
                        await sendAsync(encryptCommand(encodeCommand(new ErrorCommand(ERROR_UNKNOWN)), authorizationId, sharedSecret), characteristicId);
                    } else {
                        await sendAsync(encodeCommand(new ErrorCommand(ERROR_UNKNOWN)), characteristicId);
                    }
                    return;
                }

                console.log("sending " + response.toString());
                if (response instanceof ErrorCommand) {
                    if (response.message) {
                        console.log(response.message);
                    }
                }
                if (authorizationId !== undefined && sharedSecret) {
                    await sendAsync(encryptCommand(encodeCommand(response), authorizationId, sharedSecret), characteristicId);
                } else {
                    await sendAsync(encodeCommand(response), characteristicId);
                }
            } catch (e) {
                console.log("Error sending response, disconnecting", e);
                disconnect();
            }
        } else {
            throw new Error(`Data received on unexpected characteristic ${characteristicId} ${data.toString("hex")}`);
        }
    }

}
