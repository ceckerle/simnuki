import {DataIoCharacteristic} from "./DataIoCharacteristic";
import {
    checkCrc,
    CMD_REQUEST_DATA,
    CMD_ID_PUBLIC_KEY,
    CMD_CHALLENGE,
    CMD_AUTHORIZATION_AUTHENTICATOR,
    CMD_AUTHORIZATION_DATA,
    CMD_AUTHORIZATION_ID,
    CMD_AUTHORIZATION_ID_CONFIRMATION,
    CMD_STATUS,
    NUKI_NONCEBYTES,
    STATUS_COMPLETE,
    ERROR_UNKNOWN,
    ERROR_BAD_CRC,
    ERROR_BAD_LENGTH,
    P_ERROR_BAD_AUTHENTICATOR,
    PAIRING_GDIO_CHARACTERISTIC_UUID, readString
} from "./Protocol";
import {Configuration} from "./Configuration";
import {computeAuthenticator, deriveSharedSecret, generateKeyPair, random} from "./Crypto";

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
        const key = generateKeyPair();
        this.serverPrivateKey = key.privateKey;
        this.serverPublicKey = key.publicKey;
    }

    async handleRequest(data: Buffer): Promise<Buffer> {
        if (data.length < 4) {
            return this.buildError(ERROR_UNKNOWN, 0, "command too short");
        }

        const cmd = data.readUInt16LE(0);

        if (!checkCrc(data)) {
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
                        console.log("Pairing: 1 sending server public key " + this.serverPublicKey.toString("hex"));
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
                console.log("Pairing: 2 received client public key " + clientPublicKey.toString("hex"));
                const sharedSecret = deriveSharedSecret(this.serverPrivateKey, clientPublicKey);
                console.log("Pairing: 2 derived shared secret " + sharedSecret.toString("hex"));
                const challenge1 = random(NUKI_NONCEBYTES);
                this.state = {
                    key: "ChallengeSent",
                    clientPublicKey,
                    sharedSecret,
                    challenge: challenge1
                };
                console.log("Pairing: 2 sending challenge " + challenge1.toString("hex"));
                return this.buildMessage(CMD_CHALLENGE, challenge1);
            case CMD_AUTHORIZATION_AUTHENTICATOR:
                if (this.state.key !== "ChallengeSent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length < 36) {
                    // TODO: check/use optional data
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                const authenticator = data.slice(2, 34);
                console.log("Pairing: 3 received authenticator " + authenticator.toString("hex"));
                const cr = computeAuthenticator(this.state.sharedSecret, this.state.clientPublicKey, this.serverPublicKey, this.state.challenge);
                if (Buffer.compare(authenticator, cr) !== 0) {
                    console.log("Pairing: 3 authenticator is NOT valid, aborting");
                    return this.buildError(P_ERROR_BAD_AUTHENTICATOR, cmd, "bad authenticator");
                }
                const challenge2 = random(NUKI_NONCEBYTES);
                this.state = {
                    ...this.state,
                    key: "Challenge2Sent",
                    challenge: challenge2
                }
                console.log("Pairing: 3 authenticator is valid, sending challenge " + challenge2.toString("hex"));
                return this.buildMessage(CMD_CHALLENGE, challenge2);
            case CMD_AUTHORIZATION_DATA:
                if (this.state.key !== "Challenge2Sent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length < 103) {
                    // TODO: check/use optional data
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }
                const clCr = data.slice(2, 34);
                const appType = data.readUInt8(34);
                const idTypeBuffer = new Buffer([appType]);
                const appId = data.readUInt32LE(35);
                const idBuffer = data.slice(35, 35 + 4);
                const nameBuffer = data.slice(39, 39 + 32);
                const name = readString(nameBuffer);
                const nonceABF = data.slice(71, 71 + 32);

                console.log(`Pairing: 4 received authentication data ${clCr.toString("hex")}
\tApp Id: ${appId.toString(16).padStart(8, "0")}
\tApp Type: ${appType.toString(16).padStart(2, "0")}
\tName: ${name}
\tNonce ABF: ${nonceABF.toString("hex")}`);

                const cr2 = computeAuthenticator(this.state.sharedSecret, idTypeBuffer, idBuffer, nameBuffer, nonceABF, this.state.challenge);
                if (Buffer.compare(clCr, cr2) !== 0) {
                    console.log("Pairing: 4 authenticator is NOT valid, aborting");
                    return this.buildError(P_ERROR_BAD_AUTHENTICATOR, cmd, "bad authenticator");
                }

                const existingUser = this.config.getUsersArray().find((u) => u.name === name);
                const authorizationId = existingUser ? existingUser.authorizationId : this.config.getNextAuthorizationId();
                console.log(`Pairing: 4 authenticator is valid, ${existingUser ? "replacing" : "creating"} user ${name} with authorization id ${authorizationId}`);

                this.config.addOrReplaceUser({
                    authorizationId,
                    name,
                    appId,
                    appType,
                    sharedSecret: this.state.sharedSecret.toString('hex')
                });
                await this.config.save();

                const challenge4 = random(NUKI_NONCEBYTES);

                const newAuthorizationIdBuffer = new Buffer(4);
                newAuthorizationIdBuffer.writeUInt32LE(authorizationId, 0);

                const uuid = new Buffer(this.config.get("uuid"), "hex");
                const cr3 = computeAuthenticator(this.state.sharedSecret, newAuthorizationIdBuffer, uuid, challenge4, nonceABF);

                const wData = Buffer.concat([cr3, newAuthorizationIdBuffer, uuid, challenge4]);

                this.state = {
                    ...this.state,
                    key: "AuthorizationIdSent",
                    challenge: challenge4
                }

                console.log(`Pairing: 4 sending authorization id ${authorizationId}
\tUUID: ${uuid.toString("hex")}                
\tChallenge: ${challenge4.toString("hex")}`);
                return this.buildMessage(CMD_AUTHORIZATION_ID, wData);
            case CMD_AUTHORIZATION_ID_CONFIRMATION:
                if (this.state.key !== "AuthorizationIdSent") {
                    return this.buildError(ERROR_UNKNOWN, cmd, `unexpected state ${this.state.key} for command ${cmd}`);
                }
                if (data.length < 38) {
                    // TODO: check/use optional data
                    return this.buildError(ERROR_BAD_LENGTH, cmd, "bad length");
                }

                const authenticator2 = data.slice(2, 34);
                const authIdBuffer = data.slice(34, 38);

                console.log(`Pairing: 5 received authorization id confirmation ${authIdBuffer.readUInt32LE(0)} ${authenticator2.toString("hex")}`);

                const cr4 = computeAuthenticator(this.state.sharedSecret, authIdBuffer, this.state.challenge);
                if (Buffer.compare(authenticator2, cr4) !== 0) {
                    console.log("Pairing: 5 authenticator is NOT valid, aborting");
                    return this.buildError(P_ERROR_BAD_AUTHENTICATOR, cmd, "bad authenticator");
                }

                console.log("Pairing: 5 authenticator is valid, pairing complete");
                return this.buildMessage(CMD_STATUS, new Buffer([STATUS_COMPLETE]));
            default:
                return this.buildError(ERROR_UNKNOWN, cmd, `bad command ${cmd}`)
        }
    }

    protected buildError(code: number, cmd: number, info: string): Buffer {
        this.state = {
            key: "Initial"
        };
        return super.buildError(code, cmd, info);
    }

}
