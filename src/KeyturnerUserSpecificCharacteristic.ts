import {DataIoCharacteristic} from "./DataIoCharacteristic";
import {
    checkCrc,
    CMD_REQUEST_DATA,
    CMD_CHALLENGE,
    CMD_REQUEST_CONFIG,
    CMD_CONFIG,
    CMD_SET_CONFIG,
    CMD_SET_PIN,
    CMD_NUKI_STATES,
    CMD_VERIFY_PIN,
    CMD_STATUS,
    CMD_REQUEST_CALIBRATION,
    CMD_REQUEST_ADVANCED_CONFIG,
    CMD_ADVANCED_CONFIG,
    CMD_UPDATE_TIME,
    CMD_LOCK_ACTION,
    CMD_REMOVE_AUTHORIZATION_ENTRY,
    NUKI_NONCEBYTES,
    STATUS_COMPLETE,
    STATUS_ACCEPTED,
    ERROR_UNKNOWN,
    K_ERROR_BAD_NONCE,
    K_ERROR_BAD_PIN,
    K_ERROR_BAD_PARAMETER,
    KEYTURNER_USDIO_CHARACTERISTIC_UUID,
    NUKI_STATE_DOOR_MODE,
    LOCK_ACTION_FOB_ACTION_1,
    LOCK_ACTION_FOB_ACTION_2,
    LOCK_ACTION_FOB_ACTION_3,
    FOB_ACTION_LOCK,
    FOB_ACTION_UNLOCK,
    LOCK_ACTION_UNLOCK,
    LOCK_ACTION_LOCK,
    FOB_ACTION_LOCKNGO,
    LOCK_ACTION_LOCKNGO,
    FOB_ACTION_INTELLIGENT,
    FOB_ACTION_NONE,
    LOCK_STATE_LOCKED,
    LOCK_STATE_UNLOCKED,
    LOCK_STATE_UNLATCHED,
    LOCK_ACTION_UNLATCH,
    LOCK_ACTION_LOCKNGO_WITH_UNLATCH,
    LOCK_ACTION_FULL_LOCK,
    LOCK_STATE_UNLOCKING,
    LOCK_STATE_LOCKING,
    CMD_FIRMWARE_STATUS,
    setCrc,
    readString,
    writeString
} from "./Protocol";
import {Configuration} from "./Configuration";
import {decrypt, encrypt, random} from "./Crypto";

interface KeyturnerStateInitial {
    key: "Initial"
}

interface KeyturnerStateChallengeSent {
    key: "ChallengeSent"
    challenge: Buffer;
}

type KeyturnerState = KeyturnerStateInitial|KeyturnerStateChallengeSent;


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
        const messageLen = data.readUInt16LE(28);
        const encryptedMessage = data.slice(30);

        const users = this.config.get("users") || {};

        const user = users[authorizationId];
        if (!user) {
            console.log("bad user");
            return this.buildError(ERROR_UNKNOWN, 0, "bad user");
        }

        const sharedSecret = new Buffer(user.sharedSecret, "hex");

        const decryptedMessge = decrypt(Buffer.concat([encryptedMessage]), nonceABF, sharedSecret);

        // console.log("decrypted " + decryptedMessge.toString("hex"));

        if (!checkCrc(decryptedMessge)) {
            return this.buildError(ERROR_UNKNOWN, 0, "bad crc");
        }
        const authorizationIdFromEncryptedMessage = decryptedMessge.readUInt32LE(0);
        const cmdId = decryptedMessge.readUInt16LE(4);
        const payload = decryptedMessge.slice(6, decryptedMessge.length - 2);
        console.log("cmd " + cmdId);
        switch (cmdId) {
            case CMD_REQUEST_DATA:
                if (this.state.key !== "Initial") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                // TODO: check length
                const dataId = payload.readUInt16LE(0)
                switch (dataId) {
                    case CMD_CHALLENGE:
                        console.log("CL requests challenge");
                        const challenge = random(NUKI_NONCEBYTES);
                        this.state = {
                            key: "ChallengeSent",
                            challenge
                        }
                        return this.buildEncryptedMessage(CMD_CHALLENGE, challenge, authorizationId, nonceABF, sharedSecret);
                    case CMD_NUKI_STATES:
                        return this.buildStateMessage(authorizationId, nonceABF, sharedSecret);
                    case CMD_FIRMWARE_STATUS:
                        const firmwareStatus = Buffer.alloc(8);
                        firmwareStatus.writeUInt8(1, 0);
                        firmwareStatus.writeUInt8(2, 1);
                        firmwareStatus.writeUInt8(3, 2);
                        return this.buildEncryptedMessage(CMD_FIRMWARE_STATUS, firmwareStatus, authorizationId, nonceABF, sharedSecret);
                    default:
                        return this.buildError(ERROR_UNKNOWN, cmdId,`bad request data ${dataId}`);
                }
            case CMD_REQUEST_CONFIG:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                // TODO: check length
                console.log("CL sent CMD_REQUEST_CONFIG");
                const nonce = payload.slice(0, 32);
                // console.log("Nonce", nonce.toString("hex"), this.state.challenge.toString("hex"));

                const nukiIdStr = this.config.getNukiIdStr();
                const nukiId = new Buffer(nukiIdStr, 'hex');
                const nameBuffer = new Buffer(32);
                writeString(nameBuffer, this.config.getName());
                const latitude = this.config.get("latitude") || 0;
                const longitude = this.config.get("longitude") || 0;
                const latBuffer = new Buffer(4);
                latBuffer.writeFloatLE(latitude, 0);
                const longitudeBuffer = new Buffer(4);
                longitudeBuffer.writeFloatLE(longitude, 0);

                const autoUnlatch = new Buffer(1);
                autoUnlatch.writeUInt8(this.config.get("autoUnlatch") || 0, 0);
                const pairingEnabled = new Buffer(1);
                pairingEnabled.writeUInt8(this.config.get("pairingEnabled") == null ? 1 : this.config.get("pairingEnabled"), 0);
                const buttonEnabled = new Buffer(1);
                buttonEnabled.writeUInt8(this.config.get("buttonEnabled") == null ? 1 : this.config.get("buttonEnabled"), 0);
                const ledEnabled = new Buffer(1);
                ledEnabled.writeUInt8(this.config.get("ledEnabled") == null ? 1 : this.config.get("ledEnabled"), 0);
                const ledBrightness = new Buffer(1);
                ledBrightness.writeUInt8(this.config.get("ledBrightness") == null ? 3 : this.config.get("ledBrightness"), 0);

                const d = new Date();
                const currentTimeBuffer = new Buffer(7);
                currentTimeBuffer.writeUInt16LE(d.getFullYear(), 0);
                currentTimeBuffer.writeUInt8(d.getMonth() + 1, 2);
                currentTimeBuffer.writeUInt8(d.getDate(), 3);
                currentTimeBuffer.writeUInt8(d.getHours(), 4);
                currentTimeBuffer.writeUInt8(d.getMinutes(), 5);
                currentTimeBuffer.writeUInt8(d.getSeconds(), 6);

                const timezoneOffset = new Buffer(2);
                timezoneOffset.writeInt16LE(d.getTimezoneOffset(), 0);

                const dstMode = new Buffer(1);
                dstMode.writeUInt8(this.config.get("dstMode") == null ? 1 : this.config.get("dstMode"), 0);  // 0x01 european

                const hasFob = new Buffer(1);
                hasFob.writeUInt8(1, 0);

                const fobAction1 = new Buffer(1);
                fobAction1.writeUInt8(this.config.get("fobAction1") == null ? 1 : this.config.get("fobAction1"), 0);   // unlock
                const fobAction2 = new Buffer(1);
                fobAction2.writeUInt8(this.config.get("fobAction2") == null ? 2 : this.config.get("fobAction2"), 0);   // lock
                const fobAction3 = new Buffer(1);
                fobAction3.writeUInt8(this.config.get("fobAction3") || 0, 0);   // nothing

                const configData = Buffer.concat([nukiId, nameBuffer, latBuffer, longitudeBuffer, autoUnlatch,
                    pairingEnabled, buttonEnabled, ledEnabled, ledBrightness, currentTimeBuffer,
                    timezoneOffset, dstMode, hasFob, fobAction1, fobAction3, fobAction3]);
                this.state = {
                    key: "Initial"
                };
                return this.buildEncryptedMessage(CMD_CONFIG, configData, authorizationId, nonceABF, sharedSecret);
            case CMD_SET_CONFIG:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                // TODO: check length
                console.log("CL sent CMD_SET_CONFIG");
                const setName = readString(payload.slice(0, 32));
                const setLatitude = payload.readFloatLE(32);
                const setLongitude = payload.readFloatLE(36);
                const setAutoUnlatch = payload.readUInt8(40);
                const setPairingEnabled = payload.readUInt8(41);
                const setButtonEnabled = payload.readUInt8(42);
                const setLedFlashEnabled = payload.readUInt8(43);
                const setLedBrightness = payload.readUInt8(44);
                const setTimezoneOffset = payload.readInt16LE(45);
                const setDstMode = payload.readUInt8(47);
                const setFobAction1 = payload.readUInt8(48);
                const setFobAction2 = payload.readUInt8(49);
                const setFobAction3 = payload.readUInt8(50);
                const nonce3 = payload.slice(51, 51 + 32);
                const setPin = payload.readUInt16LE(51 + 32);

                if (Buffer.compare(this.state.challenge, nonce3) !== 0) {
                    return this.buildError(K_ERROR_BAD_NONCE, cmdId, "ERROR: nonce differ");
                }

                this.config.set("name", setName);
                this.config.set("latitude", setLatitude);
                this.config.set("longitude", setLongitude);
                this.config.set("autoUnlatch", setAutoUnlatch);
                this.config.set("pairingEnabled", setPairingEnabled);
                this.config.set("buttonEnabled", setButtonEnabled);
                this.config.set("ledFlashEnabled", setLedFlashEnabled);
                this.config.set("ledBrightness", setLedBrightness);
                this.config.set("timezoneOffset", setTimezoneOffset);
                this.config.set("dstMode", setDstMode);
                this.config.set("fobAction1", setFobAction1);
                this.config.set("fobAction2", setFobAction2);
                this.config.set("fobAction3", setFobAction3);
                this.config.set("adminPin", setPin);
                await this.config.save();
                this.state = {
                    key: "Initial"
                };
                return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
            case CMD_VERIFY_PIN:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                console.log("CL sent CMD_VERIFY_PIN", payload.toString("hex"), payload.length);
                const nonce2 = payload.slice(0, 32);
                if (Buffer.compare(this.state.challenge, nonce2) !== 0) {
                    console.log("ERROR: nonce differ");
                    console.log(this.state.challenge.toString("hex"), nonce2.toString("hex"));
                    return this.buildError(K_ERROR_BAD_NONCE, cmdId, "ERROR: nonce differ");
                }
                const pin = payload.readUInt16LE(32);
                console.log("PIN ", pin);
                const savedPin = this.config.get("adminPin");
                if (savedPin) {
                    if (savedPin === pin) {
                        console.log("PIN verified ok");
                        this.state = {
                            key: "Initial"
                        };
                        return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
                    } else {
                        return this.buildError(K_ERROR_BAD_PIN, cmdId, "ERROR: pin not ok. Saved: " + savedPin + ", given: " + pin);
                    }
                } else {
                    this.config.setNukiState(NUKI_STATE_DOOR_MODE); // TODO: why?
                    this.state = {
                        key: "Initial"
                    };
                    return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
                }
            case CMD_REQUEST_ADVANCED_CONFIG:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                console.log("CL sent CMD_REQUEST_ADVANCED_CONFIG");

                const advConfig = Buffer.alloc(28);
                this.state = {
                    key: "Initial"
                }
                return this.buildEncryptedMessage(CMD_ADVANCED_CONFIG, advConfig, authorizationId, nonceABF, sharedSecret);
            case CMD_UPDATE_TIME:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                this.state = {
                    key: "Initial"
                };
                return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
            case CMD_LOCK_ACTION:
                console.log("CL sent CMD_LOCK_ACTION");
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                const lockAction = payload.readUInt8(0);
                const appId = payload.readUInt32LE(1);
                const flags = payload.readUInt8(5);
                // nonce = payload.slice(6, 6 + 32);
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
                            return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
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
                        return this.buildError(K_ERROR_BAD_PARAMETER, cmdId, "ERROR: lock action sent with unknown lock action (" + lockAction + "). Ignoring.");
                }
                if (transitions.length > 0) {
                    await this.sendIndication(this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_ACCEPTED]), authorizationId, nonceABF, sharedSecret));
                }

                await this.sleep(2);

                for (const nextState of transitions) {
                    this.config.setLockState(nextState);
                    await this.sendIndication(this.buildStateMessage(authorizationId, nonceABF, sharedSecret));
                    await this.sleep(1);
                }

                await this.config.save();

                this.state = {
                    key: "Initial"
                }
                return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
            case CMD_REQUEST_CALIBRATION:
                console.log("CL sent CMD_REQUEST_CALIBRATION");
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                const nonce4 = payload.slice(0, 32);
                if (Buffer.compare(this.state.challenge, nonce4) !== 0) {
                    return this.buildError(K_ERROR_BAD_NONCE, cmdId, "ERROR: nonce differ");
                }
                const pin2 = payload.readUInt16LE(32);
                console.log("PIN ", pin2);
                const savedPin2 = this.config.get("adminPin");
                if (savedPin2 && savedPin2 !== pin2) {
                    return this.buildError(K_ERROR_BAD_PIN, cmdId, "ERROR: pin not ok. Saved: " + savedPin2 + ", given: " + pin2);
                }
                console.log("PIN verified ok");
                await this.sendIndication(this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_ACCEPTED]), authorizationId, nonceABF, sharedSecret));
                await this.sleep(2);
                // TODO: calibration status updates
                this.config.setLockState(LOCK_STATE_LOCKED);
                await this.config.save();
                this.state = {
                    key: "Initial"
                };
                return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
            case CMD_SET_PIN:
                console.log("CL sent CMD_SET_PIN");
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }
                const nonce5 = payload.slice(2, 2 + 32);
                if (Buffer.compare(this.state.challenge, nonce5) !== 0) {
                    return this.buildError(K_ERROR_BAD_NONCE, cmdId, "ERROR: nonce differ");
                }
                const newPin = payload.readUInt16LE(0);
                const oldPin = payload.readUInt16LE(32 + 2);
                console.log("old PIN ", oldPin);
                console.log("new PIN ", newPin);
                const savedPin3 = this.config.get("adminPin");
                if (savedPin3 && savedPin3 !== oldPin) {
                    return this.buildError(K_ERROR_BAD_PIN, cmdId, "ERROR: pin not ok. Saved: " + savedPin3 + ", given: " + oldPin);
                }
                console.log("old PIN verified ok");
                this.config.set('adminPin', newPin);
                console.log("set new Pin: ", newPin);
                await this.config.save();
                this.state = {
                    key: "Initial"
                };
                return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
            case CMD_REMOVE_AUTHORIZATION_ENTRY:
                console.log("CL sent CMD_REMOVE_AUTHORIZATION_ENTRY");
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmdId, `unexpected state ${this.state.key} for command ${cmdId}`);
                }

                const authIdToRemove = payload.readUInt32LE(0);
                const nonce6 = payload.slice(4, 4 + 32);
                if (Buffer.compare(this.state.challenge, nonce6) !== 0) {
                    return this.buildError(K_ERROR_BAD_NONCE, cmdId, "ERROR: nonce differ");
                }
                const pin4 = payload.readUInt16LE(4 + 32);
                console.log("PIN ", pin4);
                const savedPin4 = this.config.get("adminPin");
                if (savedPin4 && savedPin4 !== pin4) {
                    return this.buildError(K_ERROR_BAD_PIN, cmdId, "ERROR: pin not ok. Saved: " + savedPin4 + ", given: " + pin4);
                }
                console.log("PIN verified ok");
                const userRoRemove = users[authIdToRemove];
                if (userRoRemove) {
                    delete users[authIdToRemove];
                }
                this.state = {
                    key: "Initial"
                }
                return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
            default:
                return this.buildError(ERROR_UNKNOWN, cmdId, `bad command ${cmdId}`);
        }
    }

    protected buildError(code: number, cmd: number, info: string): Buffer {
        this.state = {
            key: "Initial"
        };
        return super.buildError(code, cmd, info);
    }

    private buildStateMessage(authId: number, nonce: Buffer, sharedSecret: Buffer) {
        const nukiState = new Buffer(1);
        nukiState.writeUInt8(this.config.getNukiState(), 0);

        const lockState = new Buffer(1);
        lockState.writeUInt8(this.config.getLockState(), 0);

        const trigger = new Buffer(1);
        trigger.writeUInt8(0, 0);  // bluetooth

        const d = new Date();
        const currentTimeBuffer = new Buffer(7);
        currentTimeBuffer.writeUInt16LE(d.getFullYear(), 0);
        currentTimeBuffer.writeUInt8(d.getMonth() + 1, 2);
        currentTimeBuffer.writeUInt8(d.getDate(), 3);
        currentTimeBuffer.writeUInt8(d.getHours(), 4);
        currentTimeBuffer.writeUInt8(d.getMinutes(), 5);
        currentTimeBuffer.writeUInt8(d.getSeconds(), 6);

        const timezoneOffset = new Buffer(2);
        timezoneOffset.writeInt16LE(d.getTimezoneOffset(), 0);

        const criticalBatteryState = new Buffer(1);
        criticalBatteryState.writeUInt8(0, 0); // ok

        const nukiStates = Buffer.concat([nukiState, lockState, trigger, currentTimeBuffer, timezoneOffset, criticalBatteryState]);

        return this.buildEncryptedMessage(CMD_NUKI_STATES, nukiStates, authId, nonce, sharedSecret);
    }

    private buildEncryptedMessage(cmd: number, payload: Buffer, authId: number, nonce: Buffer, sharedSecret: Buffer): Buffer {
        const authIdBuffer = Buffer.alloc(4);
        authIdBuffer.writeUInt32LE(authId, 0);
        const cmdBuffer = Buffer.alloc(2);
        cmdBuffer.writeUInt16LE(cmd, 0);
        const responseData = Buffer.concat([authIdBuffer, cmdBuffer, payload, Buffer.alloc(2)]);
        setCrc(responseData);
        //console.log("will encrypt", responseData.toString("hex"), responseData.length);

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
