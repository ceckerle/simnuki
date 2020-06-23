import {Command} from "./Command";
import {CMD_TIME_CONTROL_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class TimeControlEntryCommand extends Command {
    
    readonly id = CMD_TIME_CONTROL_ENTRY;
    entryId: number;
    enabled: number;
    weekdays: number;
    time: number;
    lockAction: number;

    constructor(entryId?: number, enabled?: number, weekdays?: number, time?: number, lockAction?: number) {
        super();
        this.entryId = entryId ?? 0;
        this.enabled = enabled ?? 0;
        this.weekdays = weekdays ?? 0;
        this.time = time ?? 0;
        this.lockAction = lockAction ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 6) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.entryId = buffer.readUInt8(ofs);
        ofs += 1;
        this.enabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.weekdays = buffer.readUInt8(ofs);
        ofs += 1;
        this.time = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.lockAction = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(6);
        let ofs = 0;
        buffer.writeUInt8(this.entryId, ofs);
        ofs += 1;
        buffer.writeUInt8(this.enabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.weekdays, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.time, ofs);
        ofs += 2;
        buffer.writeUInt8(this.lockAction, ofs);
        return buffer;
    }
    
}
