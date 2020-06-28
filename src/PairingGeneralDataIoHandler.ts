import {Configuration} from "./Configuration";
import {computeAuthenticator, deriveSharedSecret, generateKeyPair, random} from "./Crypto";
import {
    NUKI_NONCEBYTES,
    NUKI_STATE_PAIRING_MODE,
    NUKI_STATE_UNINITIALIZED
} from "./Protocol";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {Command} from "./command/Command";
import {ErrorCommand} from "./command/ErrorCommand";
import {DecodingError} from "./command/DecodingError";
import {
    CMD_PUBLIC_KEY,
    ERROR_UNKNOWN,
    P_ERROR_BAD_AUTHENTICATOR,
    P_ERROR_NOT_PAIRING,
    STATUS_COMPLETE
} from "./command/Constants";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {StatusCommand} from "./command/StatusCommand";
import {AuthorizationIdConfirmationCommand} from "./command/AuthorizationIdConfirmationCommand";
import {PublicKeyCommand} from "./command/PublicKeyCommand";
import {ChallengeCommand} from "./command/ChallengeCommand";
import {AuthorizationAuthenticatorCommand} from "./command/AuthorizationAuthenticatorCommand";
import {AuthorizationDataCommand} from "./command/AuthorizationDataCommand";
import {AuthorizationIdCommand} from "./command/AuthorizationIdCommand";

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

export class PairingGeneralDataIoHandler {

    private state: PairingState = {
        key: "Initial"
    };

    private serverPrivateKey: Buffer;
    private serverPublicKey: Buffer;

    constructor(private config: Configuration) {
        const key = generateKeyPair();
        this.serverPrivateKey = key.privateKey;
        this.serverPublicKey = key.publicKey;
    }

    reset(): void {
        this.state = {
            key: "Initial"
        }
    }

    async handleRequest (data: Buffer): Promise<Buffer> {
        try {
            const command = decodeCommand(data);
            console.log("received " + command.toString());
            const response = await this.handleCommand(command);
            console.log("sending " + response.toString());
            if (response instanceof ErrorCommand) {
                this.state = {
                    key: "Initial"
                };
                if (response.message) {
                    console.log(response.message);
                }
            }
            return encodeCommand(response);
        } catch (e) {
            console.log(e);
            this.state = {
                key: "Initial"
            };
            if (e instanceof DecodingError) {
                return encodeCommand(new ErrorCommand(e.code, e.commandId));
            } else {
                return encodeCommand(new ErrorCommand(ERROR_UNKNOWN));
            }
        }
    }

    private async handleCommand(command: Command): Promise<Command> {
        if (this.config.getNukiState() !== NUKI_STATE_UNINITIALIZED && this.config.getNukiState() !== NUKI_STATE_PAIRING_MODE) {
            return new ErrorCommand(P_ERROR_NOT_PAIRING, command.id, "not in pairing mode");
        }
        if (command instanceof RequestDataCommand) {
            if (this.state.key !== "Initial") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            switch (command.commandId) {
                case CMD_PUBLIC_KEY:
                    console.log("Pairing: 1 sending server public key");
                    this.state = {
                        key: "PublicKeySent"
                    }
                    return new PublicKeyCommand(this.serverPublicKey);
                default:
                    return new ErrorCommand(ERROR_UNKNOWN, command.id, `invalid request data ${command.commandId}`);
            }
        } else if (command instanceof PublicKeyCommand) {
            if (this.state.key !== "PublicKeySent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("Pairing: 2 received client public key");
            const sharedSecret = deriveSharedSecret(this.serverPrivateKey, command.publicKey);
            console.log("Pairing: 2 derived shared secret " + sharedSecret.toString("hex"));
            const challenge = random(NUKI_NONCEBYTES);
            this.state = {
                key: "ChallengeSent",
                clientPublicKey: command.publicKey,
                sharedSecret,
                challenge: challenge
            };
            console.log("Pairing: 2 sending challenge");
            return new ChallengeCommand(challenge);
        } else if (command instanceof AuthorizationAuthenticatorCommand) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("Pairing: 3 received authenticator");
            const cr = computeAuthenticator(this.state.sharedSecret, this.state.clientPublicKey, this.serverPublicKey, this.state.challenge);
            if (Buffer.compare(command.authenticator, cr) !== 0) {
                console.log("Pairing: 3 authenticator is NOT valid, aborting");
                return new ErrorCommand(P_ERROR_BAD_AUTHENTICATOR, command.id, "bad authenticator");
            }
            const challenge = random(NUKI_NONCEBYTES);
            this.state = {
                ...this.state,
                key: "Challenge2Sent",
                challenge: challenge
            }
            console.log("Pairing: 3 authenticator is valid, sending challenge");
            return new ChallengeCommand(challenge);
        } else if (command instanceof AuthorizationDataCommand) {
            if (this.state.key !== "Challenge2Sent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }

            console.log("Pairing: 4 received authentication data");

            const cr = computeAuthenticator(this.state.sharedSecret, command.getAuthenticatedData(), this.state.challenge);
            if (Buffer.compare(command.authenticator, cr) !== 0) {
                console.log("Pairing: 4 authenticator is NOT valid, aborting");
                return new ErrorCommand(P_ERROR_BAD_AUTHENTICATOR, command.id, "bad authenticator");
            }

            const existingUser = this.config.getUsersArray().find((u) => u.name === command.name);
            const authorizationId = existingUser ? existingUser.authorizationId : this.config.getNextAuthorizationId();
            console.log(`Pairing: 4 authenticator is valid, ${existingUser ? "replacing" : "creating"} user ${command.name} with authorization id ${authorizationId}`);

            this.config.addOrReplaceUser({
                authorizationId,
                name: command.name,
                appId: command.appId,
                appType: command.appType,
                sharedSecret: this.state.sharedSecret.toString('hex')
            });
            await this.config.save();

            const response = new AuthorizationIdCommand(
                undefined,
                authorizationId,
                Buffer.from(this.config.getUuid(), "hex"),
                random(NUKI_NONCEBYTES)
            )

            response.authenticator = computeAuthenticator(this.state.sharedSecret, response.getAuthenticatedData(), command.nonce);

            this.state = {
                ...this.state,
                key: "AuthorizationIdSent",
                challenge: response.nonce
            }

            console.log("Pairing: 4 sending authorization id");
            return response;
        } else if (command instanceof AuthorizationIdConfirmationCommand) {
            if (this.state.key !== "AuthorizationIdSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            console.log("Pairing: 5 received authorization id confirmation");

            const cr = computeAuthenticator(this.state.sharedSecret, command.getAuthenticatedData(), this.state.challenge);
            if (Buffer.compare(command.authenticator, cr) !== 0) {
                console.log("Pairing: 5 authenticator is NOT valid, aborting");
                return new ErrorCommand(P_ERROR_BAD_AUTHENTICATOR, command.id, "bad authenticator");
            }

            console.log("Pairing: 5 authenticator is valid, pairing complete");
            this.state = {
                key: "Initial"
            }
            return new StatusCommand(STATUS_COMPLETE);
        } else {
            return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad command ${command.id}`)
        }
    }

}
