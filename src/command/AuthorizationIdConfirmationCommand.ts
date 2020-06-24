import {Command} from "./Command";
import {CMD_AUTHORIZATION_ID_CONFIRMATION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class AuthorizationIdConfirmationCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_ID_CONFIRMATION;
    authenticator: Buffer;
    authorizationId: number;

    constructor(authenticator?: Buffer, authorizationId?: number) {
        super();
        this.authenticator = authenticator ?? Buffer.alloc(32);
        this.authorizationId = authorizationId ?? 0;
    }
    
    getAuthenticatedData(): Buffer {
        return this.encode().slice(32, 36); // authorizationId
    }

    decode(buffer: Buffer): void {
        if (buffer.length !== 36) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authenticator = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.authorizationId = buffer.readUInt32LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(36);
        let ofs = 0;
        this.authenticator.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AuthorizationIdConfirmationCommand {";
        str += "\n  authenticator: " + "0x" + this.authenticator.toString("hex");
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n}";
        return str;
    }
    
}
