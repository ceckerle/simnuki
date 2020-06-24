import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_ADD_TIME_CONTROL_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class AddTimeControlEntryCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_ADD_TIME_CONTROL_ENTRY;
    weekdays: number;
    time: number;
    lockAction: number;
    nonce: Buffer;
    securityPin: number;

    constructor(weekdays?: number, time?: number, lockAction?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.weekdays = weekdays ?? 0;
        this.time = time ?? 0;
        this.lockAction = lockAction ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 38) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.weekdays = buffer.readUInt8(ofs);
        ofs += 1;
        this.time = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.lockAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(38);
        let ofs = 0;
        buffer.writeUInt8(this.weekdays, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.time, ofs);
        ofs += 2;
        buffer.writeUInt8(this.lockAction, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
}
