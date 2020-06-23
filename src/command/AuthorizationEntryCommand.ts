import {Command} from "./Command";
import {CMD_AUTHORIZATION_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString, readDateTime, writeDateTime} from "./Util";

export class AuthorizationEntryCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_ENTRY;
    authorizationId: number;
    idType: number;
    name: string;
    enabled: number;
    remoteAllowed: number;
    dateCreated: Date;
    dateLastActive: Date;
    lockCount: number;
    timeLimited: number;
    allowedFromDate: Date;
    allowedUntilDate: Date;
    allowedWeekdays: number;
    allowedFromTime: number;
    allowedToTime: number;

    constructor(authorizationId?: number, idType?: number, name?: string, enabled?: number, remoteAllowed?: number, dateCreated?: Date, dateLastActive?: Date, lockCount?: number, timeLimited?: number, allowedFromDate?: Date, allowedUntilDate?: Date, allowedWeekdays?: number, allowedFromTime?: number, allowedToTime?: number) {
        super();
        this.authorizationId = authorizationId ?? 0;
        this.idType = idType ?? 0;
        this.name = name ?? "";
        this.enabled = enabled ?? 0;
        this.remoteAllowed = remoteAllowed ?? 0;
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
        if (buffer.length !== 75) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authorizationId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.idType = buffer.readUInt8(ofs);
        ofs += 1;
        this.name = readString(buffer, ofs, 32);
        ofs += 32;
        this.enabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.remoteAllowed = buffer.readUInt8(ofs);
        ofs += 1;
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
        const buffer = Buffer.alloc(75);
        let ofs = 0;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        ofs += 4;
        buffer.writeUInt8(this.idType, ofs);
        ofs += 1;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeUInt8(this.enabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.remoteAllowed, ofs);
        ofs += 1;
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
