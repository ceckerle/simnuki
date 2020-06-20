import {DataIoCharacteristic} from "./DataIoCharacteristic";
// @ts-ignore
import {crcOk, CMD_REQUEST_DATA, CMD_CHALLENGE, CMD_REQUEST_CONFIG, CMD_CONFIG, CMD_SET_CONFIG, CMD_SET_PIN, CMD_NUKI_STATES, CMD_VERIFY_PIN, CMD_STATUS, CMD_REQUEST_CALIBRATION, CMD_REQUEST_ADVANCED_CONFIG, CMD_ADVANCED_CONFIG, CMD_UPDATE_TIME, CMD_LOCK_ACTION, CMD_AUTHORIZATION_DATA_INVITE, CMD_REMOVE_AUTHORIZATION_ENTRY, CMD_ERROR, NUKI_NONCEBYTES, STATUS_COMPLETE, STATUS_ACCEPTED, ERROR_UNKNOWN, K_ERROR_BAD_NONCE, K_ERROR_BAD_PIN, K_ERROR_BAD_PARAMETER} from "./nuki-constants";
// @ts-ignore
import {crc16ccitt} from "crc";
import * as sodium from "sodium";

interface KeyturnerStateInitial {
    key: "Initial"
}

interface KeyturnerStateChallengeSent {
    key: "ChallengeSent"
    challenge: Buffer;
}

type KeyturnerState = KeyturnerStateInitial|KeyturnerStateChallengeSent;


export class KeyturnerCharacteristic extends DataIoCharacteristic {

    private state: KeyturnerState = {
        key: "Initial"
    };

    constructor(private config:any) {
        super("a92ee202550111e4916c0800200c9a66");
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

        const prefixBuff = Buffer.alloc(16);

        const decryptedMessge = sodium.api.crypto_secretbox_open(Buffer.concat([prefixBuff, encryptedMessage]), nonceABF, sharedSecret);

        console.log("decrypted " + decryptedMessge.toString("hex"));

        if (!crcOk(decryptedMessge)) {
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
                        const challenge = Buffer.alloc(NUKI_NONCEBYTES);
                        sodium.api.randombytes_buf(challenge);
                        this.state = {
                            key: "ChallengeSent",
                            challenge
                        }
                        return this.buildEncryptedMessage(CMD_CHALLENGE, challenge, authorizationId, nonceABF, sharedSecret);
                    case CMD_NUKI_STATES:
                        return this.buildStateMessage(authorizationId, nonceABF, sharedSecret);
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
                console.log("Nonce", nonce.toString("hex"), this.state.challenge.toString("hex"));

                var nukiIdStr = this.config.get('nukiId');
                var nukiId = new Buffer(nukiIdStr, 'hex');
                var nameStr = this.config.get("name");
                if (!nameStr) {
                    nameStr = 'Nuki_' + nukiIdStr;
                }
                var nameBuffer = new Buffer(32).fill(' ');
                const name = new Buffer(nameStr);
                if (name.length > nameBuffer.length) {
                    name.copy(nameBuffer, 0, 0, nameBuffer.length);
                } else {
                    name.copy(nameBuffer, 0, 0, name.length);
                }
                var latitude = this.config.get("latitude") || 0;
                var longitude = this.config.get("longitude") || 0;
                var latBuffer = new Buffer(4);
                latBuffer.writeFloatLE(latitude, 0);
                var longitudeBuffer = new Buffer(4);
                longitudeBuffer.writeFloatLE(longitude, 0);

                var autoUnlatch = new Buffer(1);
                autoUnlatch.writeUInt8(this.config.get("autoUnlatch") || 0, 0);
                var pairingEnabled = new Buffer(1);
                pairingEnabled.writeUInt8(this.config.get("pairingEnabled") == null ? 1 : this.config.get("pairingEnabled"), 0);
                var buttonEnabled = new Buffer(1);
                buttonEnabled.writeUInt8(this.config.get("buttonEnabled") == null ? 1 : this.config.get("buttonEnabled"), 0);
                var ledEnabled = new Buffer(1);
                ledEnabled.writeUInt8(this.config.get("ledEnabled") == null ? 1 : this.config.get("ledEnabled"), 0);
                var ledBrightness = new Buffer(1);
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

                var dstMode = new Buffer(1);
                dstMode.writeUInt8(this.config.get("dstMode") == null ? 1 : this.config.get("dstMode"), 0);  // 0x01 european

                var hasFob = new Buffer(1);
                hasFob.writeUInt8(1, 0);

                var fobAction1 = new Buffer(1);
                fobAction1.writeUInt8(this.config.get("fobAction1") == null ? 1 : this.config.get("fobAction1"), 0);   // unlock
                var fobAction2 = new Buffer(1);
                fobAction2.writeUInt8(this.config.get("fobAction2") == null ? 2 : this.config.get("fobAction2"), 0);   // lock
                var fobAction3 = new Buffer(1);
                fobAction3.writeUInt8(this.config.get("fobAction3") || 0, 0);   // nothing

                var configData = Buffer.concat([nukiId, nameBuffer, latBuffer, longitudeBuffer, autoUnlatch,
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
                const setName = payload.slice(0, 32);
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
                var setPin = payload.readUInt16LE(51 + 32);

                if (Buffer.compare(this.state.challenge, nonce3) !== 0) {
                    return this.buildError(K_ERROR_BAD_NONCE, cmdId, "ERROR: nonce differ");
                }

                this.config.set("name", setName.toString().trim());
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
                this.config.save(); // TODO: promise, error handling
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
                    this.config.set('nukiState', 2); // door mode
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
                const currentLockState = this.config.get("lockState");
                if (lockAction === 0x81 || lockAction === 0x82 || lockAction === 0x83) {
                    const fobAction = this.config.get(`fobAction${lockAction & 0xf}`);
                    switch (fobAction) {
                        case 1:
                            action = 1;
                            break;
                        case 2:
                            action = 2;
                            break;
                        case 3:
                            action = 4;
                            break;
                        case 4:
                            if (currentLockState === 1) {
                                action = 1;
                            } else {
                                if (currentLockState === 3 || currentLockState === 5) {
                                    action = 2;
                                }
                            }
                        case 0:
                        default:
                            this.state = {
                                key: "Initial"
                            };
                            return this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]), authorizationId, nonceABF, sharedSecret);
                    }

                }
                const transitions = [];
                switch (lockAction) {
                    case 1: // unlock
                        transitions.push(2);
                        transitions.push(3);
                        break;
                    case 2: // lock
                        transitions.push(4);
                        transitions.push(1);
                        break;
                    case 3: // unlatch
                        transitions.push(2);
                        transitions.push(3);
                        transitions.push(5);
                        transitions.push(3);
                        break;
                    case 4: // lock and go
                        transitions.push(2);
                        transitions.push(3);
                        transitions.push(4);
                        transitions.push(1);
                        break;
                    case 5: // lock and go with unlatch
                        transitions.push(2)
                        transitions.push(3);
                        transitions.push(5);
                        transitions.push(4);
                        transitions.push(1);
                        break;
                    case 6: // full lock
                        transitions.push(4);
                        transitions.push(1);
                        break;
                    default:
                        return this.buildError(K_ERROR_BAD_PARAMETER, cmdId, "ERROR: lock action sent with unknown lock action (" + lockAction + "). Ignoring.");
                }
                if (transitions.length > 0) {
                    await this.sendIndication(this.buildEncryptedMessage(CMD_STATUS, new Buffer([STATUS_ACCEPTED]), authorizationId, nonceABF, sharedSecret));
                }

                await this.sleep(2);

                for (const nextState of transitions) {
                    this.config.set("lockState", nextState);
                    await this.sendIndication(this.buildStateMessage(authorizationId, nonceABF, sharedSecret));
                    await this.sleep(1);
                }

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
                this.config.save(); // TODO: promise, error handling
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
                var userRoRemove = users[authIdToRemove];
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

    private buildStateMessage(authId: number, nonce: Buffer, sharedSecret: Buffer) {
        const nukiState = new Buffer(1);
        const nukiStateFromConfig = this.config.get("nukiState");
        nukiState.writeUInt8(nukiStateFromConfig, 0);

        const lockState = new Buffer(1);
        lockState.writeUInt8(this.config.get("lockState") || 1, 0);

        var trigger = new Buffer(1);
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

    private buildError(code: number, cmd: number, info: string): Buffer {
        console.log(info);
        this.state = {
            key: "Initial"
        };
        const buf = Buffer.alloc(3);
        buf.writeUInt8(code, 0)
        buf.writeUInt16LE(cmd, 1);
        return this.buildMessage(CMD_ERROR, buf);
    }

    private buildMessage(cmd: number, payload: Buffer): Buffer {
        const cmdBuffer = Buffer.alloc(2);
        cmdBuffer.writeUInt16LE(cmd, 0);
        var responseData = Buffer.concat([cmdBuffer, payload]);
        var checksum = crc16ccitt(responseData);
        var checksumBuffer = new Buffer(2);
        checksumBuffer.writeUInt16LE(checksum, 0);
        return Buffer.concat([responseData, checksumBuffer]);
    }

    private buildEncryptedMessage(cmd: number, payload: Buffer, authId: number, nonce: Buffer, sharedSecret: Buffer): Buffer {
        const authIdBuffer = Buffer.alloc(4);
        authIdBuffer.writeUInt32LE(authId, 0);
        const cmdBuffer = Buffer.alloc(2);
        cmdBuffer.writeUInt16LE(cmd, 0);
        var responseData = Buffer.concat([authIdBuffer, cmdBuffer, payload]);
        var checksum = crc16ccitt(responseData);
        var checksumBuffer = new Buffer(2);
        checksumBuffer.writeUInt16LE(checksum, 0);
        const unencrypted = Buffer.concat([responseData, checksumBuffer]);
        console.log("will encrypt", unencrypted.toString("hex"), unencrypted.length);

        const pDataEncrypted = sodium.api.crypto_secretbox(unencrypted, nonce, sharedSecret).slice(16); // skip first 16 bytes

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
