import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_REMOVE_TIME_CONTROL_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RemoveTimeControlEntryCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_REMOVE_TIME_CONTROL_ENTRY;
    entryId: number;
    nonce: Buffer;
    securityPin: number;

    constructor(entryId?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.entryId = entryId ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 35) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.entryId = buffer.readUInt8(ofs);
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(35);
        let ofs = 0;
        buffer.writeUInt8(this.entryId, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "RemoveTimeControlEntryCommand {";
        str += "\n  entryId: " + "0x" + this.entryId.toString(16).padStart(2, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
