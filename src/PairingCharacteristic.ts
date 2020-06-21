import {crc16ccitt} from "crc";
import {DataIoCharacteristic} from "./DataIoCharacteristic";
import {
    crcOk,
    CMD_REQUEST_DATA,
    CMD_ID_PUBLIC_KEY,
    CMD_CHALLENGE,
    CMD_AUTHORIZATION_AUTHENTICATOR,
    CMD_AUTHORIZATION_DATA,
    CMD_AUTHORIZATION_ID,
    CMD_AUTHORIZATION_ID_CONFIRMATION,
    CMD_STATUS,
    CMD_ERROR,
    NUKI_NONCEBYTES,
    STATUS_COMPLETE,
    ERROR_UNKNOWN,
    ERROR_BAD_CRC,
    ERROR_BAD_LENGTH,
    P_ERROR_BAD_AUTHENTICATOR,
    PAIRING_GDIO_CHARACTERISTIC_UUID
} from "./Constants";
import * as sodium from "sodium";
import {createHmac} from "crypto";
import * as _ from "underscore";
import {HSalsa20} from "./HSalsa20";
import {Configuration, User} from "./Configuration";

type PairingState = PairingStateInitial|PairingStatePublicKeySent|PairingStateChallengeSent|PairingStateChallenge2Sent|PairingStateAuthorizationIdSent;

interface PairingStateInitial {
    key: "Initial";
}

interface PairingStatePublicKeySent {
    key: "PublicKeySent";
}

interface PairingStateChallengeSent {
    key: "ChallengeSent";
    clientPublicKey: Buffer;
    sharedSecret: Buffer;
    challenge: Buffer;
}

interface PairingStateChallenge2Sent {
    key: "Challenge2Sent";
    clientPublicKey: Buffer;
    sharedSecret: Buffer;
    challenge: Buffer;
}

interface PairingStateAuthorizationIdSent {
    key: "AuthorizationIdSent";
    clientPublicKey: Buffer;
    sharedSecret: Buffer;
    challenge: Buffer;
}

export class PairingCharacteristic extends DataIoCharacteristic {

    private state: PairingState = {
        key: "Initial"
    };

    private serverPrivateKey: Buffer;
    private serverPublicKey: Buffer;

    constructor(private config: Configuration) {
        super(PAIRING_GDIO_CHARACTERISTIC_UUID);
        const key = new sodium.Key.ECDH();
        this.serverPrivateKey = key.sk().get();
        this.serverPublicKey = key.pk().get();
    }

    async handleRequest(data: Buffer): Promise<Buffer> {
        if (data.length < 4) {
            return this.buildError(ERROR_UNKNOWN, 0, "command too short");
        }

        const cmd = data.readUInt16LE(0);

        if (!crcOk(data)) {
            return this.buildError(ERROR_BAD_CRC, cmd, "bad crc");
        }

        switch (cmd) {
            case CMD_REQUEST_DATA:
                if (this.state.key !== "Initial") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length !== 6) {
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                const req = data.readUInt16LE(2);
                switch (req) {
                    case CMD_ID_PUBLIC_KEY:
                        console.log("sending public key");
                        this.state = {
                            key: "PublicKeySent"
                        }
                        return this.buildMessage(CMD_ID_PUBLIC_KEY, this.serverPublicKey);
                    default:
                        return this.buildError(ERROR_UNKNOWN, cmd, "invalid request data ${req}");
                }
            case CMD_ID_PUBLIC_KEY:
                if (this.state.key !== "PublicKeySent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length !== 36) {
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                const clientPublicKey = data.subarray(2, 2 + 32);
                const k = sodium.api.crypto_scalarmult(this.serverPrivateKey, clientPublicKey);
                const hsalsa20 = new HSalsa20();
                const sharedSecret = Buffer.alloc(32);
                const inv = Buffer.alloc(16);
                const c = new Buffer("expand 32-byte k");
                hsalsa20.crypto_core(sharedSecret, inv, k, c);
                const challenge = new Buffer(NUKI_NONCEBYTES);
                sodium.api.randombytes_buf(challenge);
                this.state = {
                    key: "ChallengeSent",
                    clientPublicKey,
                    sharedSecret,
                    challenge
                };
                return this.buildMessage(CMD_CHALLENGE, challenge);
            case CMD_AUTHORIZATION_AUTHENTICATOR:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length < 36) {
                    // TODO: check/use optional data
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                const authenticator = data.slice(2, data.length - 2);
                const r = Buffer.concat([this.state.clientPublicKey, this.serverPublicKey, this.state.challenge]);
                // use HMAC-SHA256 to create the authenticator
                const cr = createHmac('SHA256', this.state.sharedSecret).update(r).digest();

                // Step 14: verify authenticator
                if (Buffer.compare(authenticator, cr) === 0) {
                    console.log("Step 14: authenticators verified ok");

                    // Step 15: send second challenge
                    console.log("Step 15: creating one time challenge...");
                    const challenge = Buffer.alloc(NUKI_NONCEBYTES);
                    sodium.api.randombytes_buf(challenge);
                    this.state = {
                        ...this.state,
                        key: "Challenge2Sent",
                        challenge
                    }
                    return this.buildMessage(CMD_CHALLENGE, challenge);
                } else {
                    return this.buildError(P_ERROR_BAD_AUTHENTICATOR, cmd, "bad authenticator");
                }
            case CMD_AUTHORIZATION_DATA:
                if (this.state.key !== "Challenge2Sent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length < 103) {
                    // TODO: check/use optional data
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                console.log("Step 16: CL sent authorization data.");

                const clCr = data.slice(2, 34);

                console.log("Step 17: verifying authenticator...");
                const appType = data.readUInt8(34);
                const idTypeBuffer = new Buffer([appType]);
                const appId = data.readUInt32LE(35);
                const idBuffer = data.slice(35, 35 + 4);
                const nameBuffer = data.slice(39, 39 + 32);
                const nonceABF = data.slice(71, 71 + 32);

                // create authenticator for the authorization data message
                const r2 = Buffer.concat([idTypeBuffer, idBuffer, nameBuffer, nonceABF, this.state.challenge]);
                // use HMAC-SHA256 to create the authenticator
                const cr2 = createHmac('SHA256', this.state.sharedSecret).update(r2).digest();

                if (Buffer.compare(clCr, cr2) === 0) {
                    console.log("Step 17: authenticator verified ok.");

                    switch (appType) {
                        case 0:
                            console.log("Type is App");
                            break;
                        case 1:
                            console.log("Type is Bridge");
                            break;
                        case 2:
                            console.log("Type is Fob");
                            break;
                    }
                    console.log("App ID: " + appId);
                    const name = nameBuffer.toString().trim();
                    console.log("Name: " + name);

                    let newAuthorizationId = 1;

                    const users = this.config.get("users") || {};

                    const user = _.findWhere(users, {name: name}) as User;
                    if (user) {
                        newAuthorizationId = user.authorizationId;
                    } else {
                        _.each(users, (user: User) => {
                            if (user.authorizationId >= newAuthorizationId) {
                                newAuthorizationId = user.authorizationId + 1;
                            }
                        })
                    }


                    users[newAuthorizationId] = {
                        authorizationId: newAuthorizationId,
                        name: name,
                        appId: appId,
                        appType: appType,
                        sharedSecret: this.state.sharedSecret.toString('hex')
                    };
                    this.config.set("users", users);

                    await this.config.save();
                    console.log("Step 18: new user " + name + " with authorization id " + newAuthorizationId + " added to configuration");

                    console.log("Step 19: creating authorization-id command...");
                    const challenge = Buffer.alloc(NUKI_NONCEBYTES);
                    sodium.api.randombytes_buf(challenge);

                    const newAuthorizationIdBuffer = new Buffer(4);
                    newAuthorizationIdBuffer.writeUInt32LE(newAuthorizationId, 0);

                    const uuid = new Buffer(this.config.get("uuid"), "hex");
                    const r3 = Buffer.concat([newAuthorizationIdBuffer, uuid, challenge, nonceABF]);
                    // use HMAC-SHA256 to create the authenticator
                    const cr3 = createHmac('SHA256', this.state.sharedSecret).update(r3).digest();

                    const wData = Buffer.concat([cr3, newAuthorizationIdBuffer, uuid, challenge]);

                    this.state = {
                        ...this.state,
                        key: "AuthorizationIdSent",
                        challenge
                    }

                    return this.buildMessage(CMD_AUTHORIZATION_ID, wData);
                } else {
                    return this.buildError(P_ERROR_BAD_AUTHENTICATOR, cmd, "bad authenticator");
                }
            case CMD_AUTHORIZATION_ID_CONFIRMATION:
                if (this.state.key !== "AuthorizationIdSent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length < 38) {
                    // TODO: check/use optional data
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                console.log("Step 21: CL authorization-id confirmation");

                console.log("Step 22: Sending status complete.");
                return this.buildMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]));
            default:
                return this.buildError(ERROR_UNKNOWN, cmd, `bad command ${cmd}`)
        }
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
        const responseData = Buffer.concat([cmdBuffer, payload]);
        const checksum = crc16ccitt(responseData);
        const checksumBuffer = new Buffer(2);
        checksumBuffer.writeUInt16LE(checksum, 0);
        return Buffer.concat([responseData, checksumBuffer]);
    }

}
