import {Command} from "./Command";
import {CMD_AUTHORIZATION_ID, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class AuthorizationIdCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_ID;
    authenticator: Buffer;
    authorizationId: number;
    uuid: Buffer;
    nonce: Buffer;

    constructor(authenticator?: Buffer, authorizationId?: number, uuid?: Buffer, nonce?: Buffer) {
        super();
        this.authenticator = authenticator ?? Buffer.alloc(32);
        this.authorizationId = authorizationId ?? 0;
        this.uuid = uuid ?? Buffer.alloc(16);
        this.nonce = nonce ?? Buffer.alloc(32);
    }
    
    getAuthenticatedData(): Buffer {
        return this.encode().slice(32, 84); // authorizationId, uuid, nonce
    }

    decode(buffer: Buffer): void {
        if (buffer.length !== 84) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authenticator = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.authorizationId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.uuid = buffer.slice(ofs, ofs + 16);
        ofs += 16;
        this.nonce = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(84);
        let ofs = 0;
        this.authenticator.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        ofs += 4;
        this.uuid.copy(buffer, ofs);
        ofs += 16;
        this.nonce.copy(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AuthorizationIdCommand {";
        str += "\n  authenticator: " + "0x" + this.authenticator.toString("hex");
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n  uuid: " + "0x" + this.uuid.toString("hex");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n}";
        return str;
    }
    
}
