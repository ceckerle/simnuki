import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_REQUEST_AUTHORIZATION_ENTRIES, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RequestAuthorizationEntriesCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_REQUEST_AUTHORIZATION_ENTRIES;
    offset: number;
    count: number;
    nonce: Buffer;
    securityPin: number;

    constructor(offset?: number, count?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.offset = offset ?? 0;
        this.count = count ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 38) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.offset = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.count = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(38);
        let ofs = 0;
        buffer.writeUInt16LE(this.offset, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.count, ofs);
        ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
}
