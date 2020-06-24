import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_REMOVE_AUTHORIZATION_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RemoveAuthorizationEntryCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_REMOVE_AUTHORIZATION_ENTRY;
    authorizationId: number;
    nonce: Buffer;
    securityPin: number;

    constructor(authorizationId?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.authorizationId = authorizationId ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 38) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authorizationId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(38);
        let ofs = 0;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        ofs += 4;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "RemoveAuthorizationEntryCommand {";
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
