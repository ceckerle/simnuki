import {Configuration} from "./Configuration";
import {decrypt, encrypt, random} from "./Crypto";
import {
    FIRMWARE_VERSION,
    FOB_ACTION_INTELLIGENT,
    FOB_ACTION_LOCK,
    FOB_ACTION_LOCKNGO, FOB_ACTION_NONE,
    FOB_ACTION_UNLOCK, HARDWARE_VERSION,
    LOCK_ACTION_FOB_ACTION_1,
    LOCK_ACTION_FOB_ACTION_2,
    LOCK_ACTION_FOB_ACTION_3, LOCK_ACTION_FULL_LOCK,
    LOCK_ACTION_LOCK,
    LOCK_ACTION_LOCKNGO, LOCK_ACTION_LOCKNGO_WITH_UNLATCH, LOCK_ACTION_UNLATCH,
    LOCK_ACTION_UNLOCK,
    LOCK_STATE_LOCKED, LOCK_STATE_LOCKING, LOCK_STATE_UNLATCHED, LOCK_STATE_UNLOCKED, LOCK_STATE_UNLOCKING,
    NUKI_NONCEBYTES, NUKI_STATE_PAIRING_MODE, NUKI_STATE_UNINITIALIZED
} from "./Protocol";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {
    CMD_CHALLENGE,
    CMD_FIRMWARE_STATUS,
    CMD_KEYTURNER_STATES, ERROR_BAD_CRC, ERROR_BAD_LENGTH,
    ERROR_UNKNOWN,
    K_ERROR_BAD_NONCE, K_ERROR_BAD_PARAMETER, K_ERROR_BAD_PIN, K_ERROR_INVALID_AUTH_ID, STATUS_ACCEPTED, STATUS_COMPLETE
} from "./command/Constants";
import {Command} from "./command/Command";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {ErrorCommand} from "./command/ErrorCommand";
import {DecodingError} from "./command/DecodingError";
import {ChallengeCommand} from "./command/ChallengeCommand";
import {FirmwareStatusCommand} from "./command/FirmwareStatusCommand";
import {RequestConfigCommand} from "./command/RequestConfigCommand";
import {ConfigCommand} from "./command/ConfigCommand";
import {SetConfigCommand} from "./command/SetConfigCommand";
import {StatusCommand} from "./command/StatusCommand";
import {VerifySecurityPinCommand} from "./command/VerifySecurityPinCommand";
import {RequestAdvancedConfigCommand} from "./command/RequestAdvancedConfigCommand";
import {AdvancedConfigCommand} from "./command/AdvancedConfigCommand";
import {UpdateTimeCommand} from "./command/UpdateTimeCommand";
import {LockActionCommand} from "./command/LockActionCommand";
import {RequestCalibrationCommand} from "./command/RequestCalibrationCommand";
import {SetSecurityPinCommand} from "./command/SetSecurityPinCommand";
import {RemoveAuthorizationEntryCommand} from "./command/RemoveAuthorizationEntryCommand";
import {KeyturnerStatesCommand} from "./command/KeyturnerStatesCommand";
import {checkCrc, setCrc} from "./command/Util";
import {SetAdvancedConfigCommand} from "./command/SetAdvancedConfigCommand";
import {CommandNeedsChallenge} from "./command/CommandNeedsChallenge";
import {CommandNeedsSecurityPin} from "./command/CommandNeedsSecurityPin";
import {RequestAuthorizationEntriesCommand} from "./command/RequestAuthorizationEntriesCommand";
import {AuthorizationEntryCountCommand} from "./command/AuthorizationEntryCountCommand";
import {AuthorizationEntryCommand} from "./command/AuthorizationEntryCommand";
import {UpdateAuthorizationEntryCommand} from "./command/UpdateAuthorizationEntryCommand";
import {RequestLogEntriesCommand} from "./command/RequestLogEntriesCommand";
import {LogEntryCountCommand} from "./command/LogEntryCountCommand";
import {EnableLoggingCommand} from "./command/EnableLoggingCommand";

interface KeyturnerStateInitial {
    key: "Initial"
}

interface KeyturnerStateChallengeSent {
    key: "ChallengeSent"
    challenge: Buffer;
}

type KeyturnerState = KeyturnerStateInitial|KeyturnerStateChallengeSent;

export class KeyturnerUserSpecificDataIoHandler {

    private state: KeyturnerState = {
        key: "Initial"
    };

    constructor(private config: Configuration) {
    }

    reset(): void {
        this.state = {
            key: "Initial"
        }
    }

    async handleRequest(data: Buffer, sendAsync: (data: Buffer) => Promise<void>): Promise<Buffer> {
        try {
            const {data: decrypted, authorizationId, nonce, sharedSecret} = decryptCommand(data, (id) => {
                const user = this.config.getUser(id);
                return user && new Buffer(user.sharedSecret, "hex");
            });
            try {
                const command = decodeCommand(decrypted, true);
                console.log("received " + command.toString());

                const sendCommand = async (command: Command): Promise<void> => {
                    console.log("sending " + command.toString());
                    await sendAsync(encryptCommand(encodeCommand(command), authorizationId, nonce, sharedSecret));
                };

                const response = await this.handleCommand(command, sendCommand);
                console.log("sending " + response.toString());
                if (response instanceof ErrorCommand) {
                    this.state = {
                        key: "Initial"
                    };
                    if (response.message) {
                        console.log(response.message);
                    }
                }
                return encryptCommand(encodeCommand(response), authorizationId, nonce, sharedSecret);
            } catch (e) {
                console.log("Command failed", decrypted.toString("hex"), e);
                this.state = {
                    key: "Initial"
                };
                if (e instanceof DecodingError) {
                    return encryptCommand(encodeCommand(new ErrorCommand(e.code, e.commandId)), authorizationId, nonce, sharedSecret);
                } else {
                    return encryptCommand(encodeCommand(new ErrorCommand(ERROR_UNKNOWN)), authorizationId, nonce, sharedSecret);
                }
            }
        } catch (e) {
            console.log("Decryption failed", data.toString("hex"), e);
            throw e;
        }
    }

    private async handleCommand(command: Command, sendCommand: (command: Command) => Promise<void>): Promise<Command> {
        if (command instanceof CommandNeedsChallenge) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            this.state = {
                key: "Initial"
            };
        } else if (this.state.key !== "Initial") {
            return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
        }
        if (command instanceof CommandNeedsSecurityPin) {
            if (command.securityPin !== this.config.getAdminPin()) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, `ERROR: bad pin ${command.securityPin}`);
            }
        }
        if (command instanceof RequestDataCommand) {
            switch (command.commandId) {
                case CMD_CHALLENGE:
                    const challenge = new ChallengeCommand(random(NUKI_NONCEBYTES));
                    this.state = {
                        key: "ChallengeSent",
                        challenge: challenge.nonce
                    }
                    return challenge;
                case CMD_KEYTURNER_STATES:
                    return this.buildStateCommand();
                case CMD_FIRMWARE_STATUS:
                    return new FirmwareStatusCommand(FIRMWARE_VERSION);
                default:
                    return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad request data ${command.commandId}`);
            }
        } else if (command instanceof RequestConfigCommand) {
            const now = new Date();
            return new ConfigCommand(
                parseInt(this.config.getNukiIdStr(), 16),
                this.config.getName(),
                this.config.get("latitude"),
                this.config.get("longitude"),
                this.config.get("autoUnlatch"),
                this.config.get("pairingEnabled") ?? 1,
                this.config.get("buttonEnabled") ?? 1,
                this.config.get("ledFlashEnabled") ?? 1,
                this.config.get("ledBrightness") ?? 1,
                now,
                -now.getTimezoneOffset(),
                this.config.get("dstMode") ?? 1,
                true,
                this.config.get("fobAction1") ?? 1, // unlock
                this.config.get("fobAction2") ?? 2, // lock
                this.config.get("fobAction3"),
                this.config.get("singleLock"),
                this.config.get("advertisingMode"),
                false,
                FIRMWARE_VERSION,
                HARDWARE_VERSION,
                0,
                this.config.get("timezoneId") ?? 37
            );
        } else if (command instanceof SetConfigCommand) {
            this.config.setName(command.name);
            this.config.set("latitude", command.latitude);
            this.config.set("longitude", command.longitude);
            this.config.set("autoUnlatch", command.autoUnlatch);
            this.config.set("pairingEnabled", command.pairingEnabled);
            this.config.set("buttonEnabled", command.buttonEnabled);
            this.config.set("ledFlashEnabled", command.ledEnabled);
            this.config.set("ledBrightness", command.ledBrightness);
            this.config.set("dstMode", command.dstMode);
            this.config.set("fobAction1", command.fobAction1);
            this.config.set("fobAction2", command.fobAction2);
            this.config.set("fobAction3", command.fobAction3);
            this.config.set("singleLock", command.singleLock);
            this.config.set("advertisingMode", command.advertisingMode);
            this.config.set("timezoneId", command.timezoneId);

            if (this.config.getNukiState() === NUKI_STATE_UNINITIALIZED) {
                this.config.setNukiState(NUKI_STATE_PAIRING_MODE);
            }

            await this.config.save();
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof VerifySecurityPinCommand) {
            // pin already verified

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestAdvancedConfigCommand) {
            // TODO: implement

            return new AdvancedConfigCommand();
        } else if (command instanceof SetAdvancedConfigCommand) {
            // TODO: implement

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof UpdateTimeCommand) {
            // ignore

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof LockActionCommand) {
            const lockAction = command.lockAction;
            let action = lockAction;
            const currentLockState = this.config.getLockState();
            if (lockAction === LOCK_ACTION_FOB_ACTION_1 || lockAction === LOCK_ACTION_FOB_ACTION_2 || lockAction === LOCK_ACTION_FOB_ACTION_3) {
                const fobAction = this.config.get(`fobAction${lockAction & 0xf}`);
                switch (fobAction) {
                    case FOB_ACTION_UNLOCK:
                        action = LOCK_ACTION_UNLOCK;
                        break;
                    case FOB_ACTION_LOCK:
                        action = LOCK_ACTION_LOCK;
                        break;
                    case FOB_ACTION_LOCKNGO:
                        action = LOCK_ACTION_LOCKNGO;
                        break;
                    case FOB_ACTION_INTELLIGENT:
                        if (currentLockState === LOCK_STATE_LOCKED) {
                            action = LOCK_ACTION_UNLOCK;
                        } else {
                            if (currentLockState === LOCK_STATE_UNLOCKED || currentLockState === LOCK_STATE_UNLATCHED) {
                                action = LOCK_ACTION_LOCK;
                            }
                        }
                        break;
                    case FOB_ACTION_NONE:
                    default:
                        return new StatusCommand(STATUS_COMPLETE);
                }

            }
            const transitions = [];
            switch (action) {
                case LOCK_ACTION_UNLOCK:
                    transitions.push(LOCK_STATE_UNLOCKING);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    break;
                case LOCK_ACTION_LOCK:
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                case LOCK_ACTION_UNLATCH:
                    transitions.push(LOCK_STATE_UNLOCKING);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    transitions.push(LOCK_STATE_UNLATCHED);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    break;
                case LOCK_ACTION_LOCKNGO:
                    transitions.push(LOCK_STATE_UNLOCKING);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                case LOCK_ACTION_LOCKNGO_WITH_UNLATCH:
                    transitions.push(LOCK_STATE_UNLOCKING)
                    transitions.push(LOCK_STATE_UNLOCKED);
                    transitions.push(LOCK_STATE_UNLATCHED);
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                case LOCK_ACTION_FULL_LOCK:
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                default:
                    return new ErrorCommand(K_ERROR_BAD_PARAMETER, command.id, "ERROR: lock action sent with unknown lock action (" + lockAction + "). Ignoring.");
            }
            if (transitions.length > 0) {
                await sendCommand(new StatusCommand(STATUS_ACCEPTED));
            }

            await this.sleep(2);

            for (const nextState of transitions) {
                this.config.setLockState(nextState);
                await sendCommand(this.buildStateCommand());
                await this.sleep(1);
            }

            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestCalibrationCommand) {
            await sendCommand(new StatusCommand(STATUS_ACCEPTED));
            await this.sleep(2);
            // TODO: calibration status updates
            this.config.setLockState(LOCK_STATE_LOCKED);
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof SetSecurityPinCommand) {
            console.log("Set new PIN: ", command.pin);
            this.config.setAdminPin(command.pin);
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RemoveAuthorizationEntryCommand) {
            const user = this.config.getUser(command.authorizationId);
            if (!user) {
                return new ErrorCommand(K_ERROR_INVALID_AUTH_ID, command.id, `User does not exist ${command.authorizationId}`);
            }

            this.config.removeUser(command.authorizationId);
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestAuthorizationEntriesCommand) {
            const users = this.config.getUsersArray();
            if (command.offset === 0) {
                await sendCommand(new AuthorizationEntryCountCommand(users.length));
            }
            for (const user of users.slice(command.offset, command.offset + command.count)) {
                await sendCommand(new AuthorizationEntryCommand(
                    user.authorizationId,
                    user.appType,
                    user.name,
                    true,
                    true
                ));
            }
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof UpdateAuthorizationEntryCommand) {
            const user = this.config.getUser(command.authorizationId);
            if (!user) {
                return new ErrorCommand(K_ERROR_INVALID_AUTH_ID, command.id, `User does not exist ${command.authorizationId}`);
            }

            this.config.addOrReplaceUser({
                ...user,
                name: command.name
            });
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestLogEntriesCommand) {
            if (command.totalCount) {
                await sendCommand(new LogEntryCountCommand(1, 0, false, false));
            }
            // TODO: implement logging

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof EnableLoggingCommand) {
            // TODO: implement logging

            return new StatusCommand(STATUS_COMPLETE);
        } else {
            return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad command ${command.id}`);
        }
    }

    private buildStateCommand(): KeyturnerStatesCommand {
        const now = new Date();
        return new KeyturnerStatesCommand(
            this.config.getNukiState(),
            this.config.getLockState(),
            0, // bluetooth
            now,
            -now.getTimezoneOffset(),
            false,
            0,
            0,
            0,
            0,
            0,
            0
        );
    }

    private async sleep(secs: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, secs * 1000);
        });
    }

}

export function decryptCommand(data: Buffer, sharedSecretProvider: (authId: number) => Buffer|undefined): {
    data: Buffer,
    authorizationId: number,
    nonce: Buffer,
    sharedSecret: Buffer
} {
    if (data.length < 38) {
        throw new DecodingError(ERROR_BAD_LENGTH, 0, "bad length");
    }

    const nonce = data.slice(0, 24);
    const authorizationId = data.readUInt32LE(24);
    const commandLen = data.readUInt16LE(28);
    const encryptedCommand = data.slice(30);
    if (encryptedCommand.length !== commandLen) {
        throw new DecodingError(ERROR_BAD_LENGTH, 0, "bad encrypted command length");
    }

    const sharedSecret = sharedSecretProvider(authorizationId);
    if (!sharedSecret) {
        throw new DecodingError(K_ERROR_INVALID_AUTH_ID, 0, "bad user");
    }

    const decryptedCommand = decrypt(Buffer.concat([encryptedCommand]), nonce, sharedSecret);
    if (!decryptedCommand) {
        throw new DecodingError(ERROR_UNKNOWN, 0, "bad encryption");
    }

    if (!checkCrc(decryptedCommand)) {
        throw new DecodingError(ERROR_BAD_CRC, 0, "bad crc");
    }

    const authorizationIdFromEncryptedCommand = decryptedCommand.readUInt32LE(0);
    if (authorizationIdFromEncryptedCommand !== authorizationId) {
        throw new DecodingError(K_ERROR_INVALID_AUTH_ID, 0, "invalid encrypted command auth id");
    }

    return {
        data: decryptedCommand.slice(4),
        authorizationId,
        nonce,
        sharedSecret
    };
}

export function encryptCommand(data: Buffer, authId: number, nonce: Buffer, sharedSecret: Buffer): Buffer {
    const authIdBuffer = Buffer.alloc(4);
    authIdBuffer.writeUInt32LE(authId, 0);
    const responseData = Buffer.concat([authIdBuffer, data]);
    setCrc(responseData);

    const pDataEncrypted = encrypt(responseData, nonce, sharedSecret);

    const lenBuffer = new Buffer(2);
    lenBuffer.writeUInt16LE(pDataEncrypted.length, 0);

    return Buffer.concat([nonce, authIdBuffer, lenBuffer, pDataEncrypted]);
}
