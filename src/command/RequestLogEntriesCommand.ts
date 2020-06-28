import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_REQUEST_LOG_ENTRIES, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RequestLogEntriesCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_REQUEST_LOG_ENTRIES;
    startIndex: number;
    count: number;
    sortOrder: boolean;
    totalCount: boolean;
    nonce: Buffer;
    securityPin: number;

    constructor(startIndex?: number, count?: number, sortOrder?: boolean, totalCount?: boolean, nonce?: Buffer, securityPin?: number) {
        super();
        this.startIndex = startIndex ?? 0;
        this.count = count ?? 0;
        this.sortOrder = sortOrder ?? false;
        this.totalCount = totalCount ?? false;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 42) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.startIndex = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.count = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.sortOrder = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.totalCount = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(42);
        let ofs = 0;
        buffer.writeUInt32LE(this.startIndex, ofs);
        ofs += 4;
        buffer.writeUInt16LE(this.count, ofs);
        ofs += 2;
        buffer.writeUInt8(this.sortOrder ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.totalCount ? 1 : 0, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "RequestLogEntriesCommand {";
        str += "\n  startIndex: " + "0x" + this.startIndex.toString(16).padStart(8, "0");
        str += "\n  count: " + "0x" + this.count.toString(16).padStart(4, "0");
        str += "\n  sortOrder: " + this.sortOrder;
        str += "\n  totalCount: " + this.totalCount;
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
