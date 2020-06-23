import {Command} from "./Command";
import {CMD_KEYPAD_CODE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString, readDateTime, writeDateTime} from "./Util";

export class KeypadCodeCommand extends Command {
    
    readonly id = CMD_KEYPAD_CODE;
    codeId: number;
    code: number;
    name: string;
    dateCreated: Date;
    dateLastActive: Date;
    lockCount: number;
    timeLimited: number;
    allowedFromDate: Date;
    allowedUntilDate: Date;
    allowedWeekdays: number;
    allowedFromTime: number;
    allowedToTime: number;

    constructor(codeId?: number, code?: number, name?: string, dateCreated?: Date, dateLastActive?: Date, lockCount?: number, timeLimited?: number, allowedFromDate?: Date, allowedUntilDate?: Date, allowedWeekdays?: number, allowedFromTime?: number, allowedToTime?: number) {
        super();
        this.codeId = codeId ?? 0;
        this.code = code ?? 0;
        this.name = name ?? "";
        this.dateCreated = dateCreated ?? new Date();
        this.dateLastActive = dateLastActive ?? new Date();
        this.lockCount = lockCount ?? 0;
        this.timeLimited = timeLimited ?? 0;
        this.allowedFromDate = allowedFromDate ?? new Date();
        this.allowedUntilDate = allowedUntilDate ?? new Date();
        this.allowedWeekdays = allowedWeekdays ?? 0;
        this.allowedFromTime = allowedFromTime ?? 0;
        this.allowedToTime = allowedToTime ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 62) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.codeId = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.code = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.name = readString(buffer, ofs, 20);
        ofs += 20;
        this.dateCreated = readDateTime(buffer, ofs);
        ofs += 7;
        this.dateLastActive = readDateTime(buffer, ofs);
        ofs += 7;
        this.lockCount = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.timeLimited = buffer.readUInt8(ofs);
        ofs += 1;
        this.allowedFromDate = readDateTime(buffer, ofs);
        ofs += 7;
        this.allowedUntilDate = readDateTime(buffer, ofs);
        ofs += 7;
        this.allowedWeekdays = buffer.readUInt8(ofs);
        ofs += 1;
        this.allowedFromTime = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.allowedToTime = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(62);
        let ofs = 0;
        buffer.writeUInt16LE(this.codeId, ofs);
        ofs += 2;
        buffer.writeUInt32LE(this.code, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 20);
        ofs += 20;
        writeDateTime(buffer, this.dateCreated, ofs);
        ofs += 7;
        writeDateTime(buffer, this.dateLastActive, ofs);
        ofs += 7;
        buffer.writeUInt16LE(this.lockCount, ofs);
        ofs += 2;
        buffer.writeUInt8(this.timeLimited, ofs);
        ofs += 1;
        writeDateTime(buffer, this.allowedFromDate, ofs);
        ofs += 7;
        writeDateTime(buffer, this.allowedUntilDate, ofs);
        ofs += 7;
        buffer.writeUInt8(this.allowedWeekdays, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.allowedFromTime, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.allowedToTime, ofs);
        return buffer;
    }
    
}
