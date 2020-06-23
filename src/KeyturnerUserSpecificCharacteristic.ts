import {DataIoCharacteristic} from "./DataIoCharacteristic";
import {Configuration} from "./Configuration";
import {decrypt, encrypt, random} from "./Crypto";
import {
    FOB_ACTION_INTELLIGENT,
    FOB_ACTION_LOCK,
    FOB_ACTION_LOCKNGO, FOB_ACTION_NONE,
    FOB_ACTION_UNLOCK,
    KEYTURNER_USDIO_CHARACTERISTIC_UUID,
    LOCK_ACTION_FOB_ACTION_1,
    LOCK_ACTION_FOB_ACTION_2,
    LOCK_ACTION_FOB_ACTION_3, LOCK_ACTION_FULL_LOCK,
    LOCK_ACTION_LOCK,
    LOCK_ACTION_LOCKNGO, LOCK_ACTION_LOCKNGO_WITH_UNLATCH, LOCK_ACTION_UNLATCH,
    LOCK_ACTION_UNLOCK,
    LOCK_STATE_LOCKED, LOCK_STATE_LOCKING, LOCK_STATE_UNLATCHED, LOCK_STATE_UNLOCKED, LOCK_STATE_UNLOCKING,
    NUKI_NONCEBYTES
} from "./Protocol";
import {decodeCommand} from "./command/Codec";
import {
    CMD_CHALLENGE,
    CMD_FIRMWARE_STATUS,
    CMD_KEYTURNER_STATES, ERROR_BAD_CRC,
    ERROR_UNKNOWN,
    K_ERROR_BAD_NONCE, K_ERROR_BAD_PARAMETER, K_ERROR_BAD_PIN, STATUS_ACCEPTED, STATUS_COMPLETE
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

interface KeyturnerStateInitial {
    key: "Initial"
}

interface KeyturnerStateChallengeSent {
    key: "ChallengeSent"
    challenge: Buffer;
}

type KeyturnerState = KeyturnerStateInitial|KeyturnerStateChallengeSent;

interface EncryptionContext {
    authorizationId: number;
    nonce: Buffer;
    sharedSecret: Buffer;
}

export class KeyturnerUserSpecificCharacteristic extends DataIoCharacteristic {

    private state: KeyturnerState = {
        key: "Initial"
    };

    constructor(private config: Configuration) {
        super(KEYTURNER_USDIO_CHARACTERISTIC_UUID);
    }

    async handleRequest(data: Buffer): Promise<Buffer> {
        // TODO: check length

        const nonceABF = data.slice(0, 24);
        const authorizationId = data.readUInt32LE(24);
        const commandLen = data.readUInt16LE(28);
        const encryptedCommand = data.slice(30);

        const users = this.config.get("users") || {};

        const user = users[authorizationId];
        if (!user) {
            console.log("bad user");
            return this.buildError(ERROR_UNKNOWN, 0, "bad user");
        }

        const sharedSecret = new Buffer(user.sharedSecret, "hex");

        const decryptedCommand = decrypt(Buffer.concat([encryptedCommand]), nonceABF, sharedSecret);

        if (!checkCrc(decryptedCommand)) {
            return this.buildError(ERROR_BAD_CRC, 0, "bad crc");
        }

        const authorizationIdFromEncryptedCommand = decryptedCommand.readUInt32LE(0);

        const encryptionContext = {
            authorizationId,
            nonce: nonceABF,
            sharedSecret
        }

        // console.log("decrypted " + decryptedMessge.toString("hex"));

        try {
            const command = decodeCommand(decryptedCommand.slice(4), true);
            const response = await this.handleCommand(command, encryptionContext);
            if (response instanceof ErrorCommand) {
                this.state = {
                    key: "Initial"
                };
                if (response.message) {
                    console.log(response.message);
                }
            }
            return this.encryptCommand(response, authorizationId, nonceABF, sharedSecret);
        } catch (e) {
            console.log(e);
            this.state = {
                key: "Initial"
            };
            if (e instanceof DecodingError) {
                return this.encryptCommand(new ErrorCommand(e.code, e.commandId), authorizationId, nonceABF, sharedSecret);
            } else {
                return this.encryptCommand(new ErrorCommand(ERROR_UNKNOWN), authorizationId, nonceABF, sharedSecret);
            }
        }
    }

    private async handleCommand(command: Command, encryptionContext: EncryptionContext): Promise<Command> {
        if (command instanceof RequestDataCommand) {
            if (this.state.key !== "Initial") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            switch (command.commandId) {
                case CMD_CHALLENGE:
                    console.log("CL requests challenge");
                    const challenge = new ChallengeCommand(random(NUKI_NONCEBYTES));
                    this.state = {
                        key: "ChallengeSent",
                        challenge: challenge.nonce
                    }
                    return challenge;
                case CMD_KEYTURNER_STATES:
                    return this.buildStateCommand();
                case CMD_FIRMWARE_STATUS:
                    return new FirmwareStatusCommand(0x010203);
                default:
                    return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad request data ${command.commandId}`);
            }
        } else if (command instanceof RequestConfigCommand) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("CL sent CMD_REQUEST_CONFIG");
            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }

            this.state = {
                key: "Initial"
            };

            const now = new Date();
            return new ConfigCommand(
                parseInt(this.config.getNukiIdStr(), 16),
                this.config.getName(),
                this.config.get("latitude"),
                this.config.get("longitude"),
                this.config.get("autoUnlatch"),
                this.config.get("pairingEnabled"),
                this.config.get("buttonEnabled"),
                this.config.get("ledFlashEnabled"),
                this.config.get("ledBrightness"),
                now,
                -now.getTimezoneOffset(),
                this.config.get("dstMode") ?? 1,
                1,
                this.config.get("fobAction1") || 1, // unlock
                this.config.get("fobAction2") || 2, // lock
                this.config.get("fobAction3"),
            );
        } else if (command instanceof SetConfigCommand) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("CL sent CMD_SET_CONFIG");

            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            if (command.securityPin !== this.config.get("adminPin")) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, "ERROR: bad pin");
            }

            this.config.set("name", command.name);
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
            await this.config.save();
            this.state = {
                key: "Initial"
            };
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof VerifySecurityPinCommand) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("CL sent CMD_VERIFY_PIN");

            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            this.state = {
                key: "Initial"
            };

            console.log("PIN ", command.securityPin);

            if (command.securityPin !== this.config.get("adminPin")) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, "ERROR: bad pin");
            }

            // TODO: why? this.config.setNukiState(NUKI_STATE_DOOR_MODE);

            console.log("PIN verified ok");
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestAdvancedConfigCommand) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("CL sent CMD_REQUEST_ADVANCED_CONFIG");

            this.state = {
                key: "Initial"
            }
            return new AdvancedConfigCommand();
        } else if (command instanceof UpdateTimeCommand) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            this.state = {
                key: "Initial"
            };
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof LockActionCommand) {
            console.log("CL sent CMD_LOCK_ACTION");
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }

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
                        this.state = {
                            key: "Initial"
                        };
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
                await this.sendCommand(new StatusCommand(STATUS_ACCEPTED), encryptionContext);
            }

            await this.sleep(2);

            for (const nextState of transitions) {
                this.config.setLockState(nextState);
                await this.sendCommand(this.buildStateCommand(), encryptionContext);
                await this.sleep(1);
            }

            await this.config.save();

            this.state = {
                key: "Initial"
            }
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestCalibrationCommand) {
            console.log("CL sent CMD_REQUEST_CALIBRATION");
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            console.log("PIN ", command.securityPin);
            const savedPin2 = this.config.get("adminPin");
            if (savedPin2 && savedPin2 !== command.securityPin) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, "ERROR: pin not ok. Saved: " + savedPin2 + ", given: " + command.securityPin);
            }
            console.log("PIN verified ok");
            await this.sendCommand(new StatusCommand(STATUS_ACCEPTED), encryptionContext);
            await this.sleep(2);
            // TODO: calibration status updates
            this.config.setLockState(LOCK_STATE_LOCKED);
            await this.config.save();
            this.state = {
                key: "Initial"
            };
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof SetSecurityPinCommand) {
            console.log("CL sent CMD_SET_PIN");
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            console.log("old PIN ", command.securityPin);
            console.log("new PIN ", command.pin);
            const savedPin3 = this.config.get("adminPin");
            if (savedPin3 && savedPin3 !== command.securityPin) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, "ERROR: pin not ok. Saved: " + savedPin3 + ", given: " + command.securityPin);
            }
            console.log("old PIN verified ok");
            this.config.set('adminPin', command.pin);
            console.log("set new Pin: ", command.pin);
            await this.config.save();
            this.state = {
                key: "Initial"
            };
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RemoveAuthorizationEntryCommand) {
            console.log("CL sent CMD_REMOVE_AUTHORIZATION_ENTRY");
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            console.log("PIN ", command.securityPin);
            const savedPin4 = this.config.get("adminPin");
            if (savedPin4 && savedPin4 !== command.securityPin) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, "ERROR: pin not ok. Saved: " + savedPin4 + ", given: " + command.securityPin);
            }
            console.log("PIN verified ok");
            this.config.removeUser(command.authorizationId);
            await this.config.save();
            this.state = {
                key: "Initial"
            }
            return new StatusCommand(STATUS_COMPLETE);
        } else {
            return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad command ${command.id}`);
        }
    }

    private buildStateCommand(): KeyturnerStatesCommand {
        return new KeyturnerStatesCommand(
            this.config.getNukiState(),
            this.config.getLockState(),
            0, // bluetooth
            new Date(),
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        );
    }

    private async sendCommand(command: Command, encryptionContext: EncryptionContext): Promise<void> {
        await this.sendIndication(this.encryptCommand(command, encryptionContext.authorizationId, encryptionContext.nonce, encryptionContext.sharedSecret));
    }

    private encryptCommand(command: Command, authId: number, nonce: Buffer, sharedSecret: Buffer): Buffer {
        const authIdBuffer = Buffer.alloc(4);
        authIdBuffer.writeUInt32LE(authId, 0);
        const cmdBuffer = Buffer.alloc(2);
        cmdBuffer.writeUInt16LE(command.id, 0);
        const responseData = Buffer.concat([authIdBuffer, cmdBuffer, command.encode(), Buffer.alloc(2)]);
        setCrc(responseData);

        // console.log("will encrypt", responseData.toString("hex"), responseData.length);

        const pDataEncrypted = encrypt(responseData, nonce, sharedSecret);

        const lenBuffer = new Buffer(2);
        lenBuffer.writeUInt16LE(pDataEncrypted.length, 0);

        return Buffer.concat([nonce, authIdBuffer, lenBuffer, pDataEncrypted]);
    }

    private async sleep(secs: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, secs * 1000);
        });
    }

}
