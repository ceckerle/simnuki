import {Command} from "./Command";
import {CMD_AUTHORIZATION_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";
import {DateTime} from "./DateTime";
import {Time} from "./Time";

export class AuthorizationEntryCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_ENTRY;
    authorizationId: number;
    idType: number;
    name: string;
    enabled: boolean;
    remoteAllowed: boolean;
    dateCreated: DateTime;
    dateLastActive: DateTime;
    lockCount: number;
    timeLimited: boolean;
    allowedFromDate: DateTime;
    allowedUntilDate: DateTime;
    allowedWeekdays: number;
    allowedFromTime: Time;
    allowedToTime: Time;

    constructor(authorizationId?: number, idType?: number, name?: string, enabled?: boolean, remoteAllowed?: boolean, dateCreated?: DateTime, dateLastActive?: DateTime, lockCount?: number, timeLimited?: boolean, allowedFromDate?: DateTime, allowedUntilDate?: DateTime, allowedWeekdays?: number, allowedFromTime?: Time, allowedToTime?: Time) {
        super();
        this.authorizationId = authorizationId ?? 0;
        this.idType = idType ?? 0;
        this.name = name ?? "";
        this.enabled = enabled ?? false;
        this.remoteAllowed = remoteAllowed ?? false;
        this.dateCreated = dateCreated ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.dateLastActive = dateLastActive ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.lockCount = lockCount ?? 0;
        this.timeLimited = timeLimited ?? false;
        this.allowedFromDate = allowedFromDate ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.allowedUntilDate = allowedUntilDate ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.allowedWeekdays = allowedWeekdays ?? 0;
        this.allowedFromTime = allowedFromTime ?? new Time(0, 0);
        this.allowedToTime = allowedToTime ?? new Time(0, 0);
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
        this.enabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.remoteAllowed = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.dateCreated = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.dateLastActive = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.lockCount = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.timeLimited = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.allowedFromDate = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.allowedUntilDate = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.allowedWeekdays = buffer.readUInt8(ofs);
        ofs += 1;
        this.allowedFromTime = Time.decode(buffer, ofs);
        ofs += 2;
        this.allowedToTime = Time.decode(buffer, ofs);
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
        buffer.writeUInt8(this.enabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.remoteAllowed === true ? 1 : 0, ofs);
        ofs += 1;
        this.dateCreated.encode(buffer, ofs);
        ofs += 7;
        this.dateLastActive.encode(buffer, ofs);
        ofs += 7;
        buffer.writeUInt16LE(this.lockCount, ofs);
        ofs += 2;
        buffer.writeUInt8(this.timeLimited === true ? 1 : 0, ofs);
        ofs += 1;
        this.allowedFromDate.encode(buffer, ofs);
        ofs += 7;
        this.allowedUntilDate.encode(buffer, ofs);
        ofs += 7;
        buffer.writeUInt8(this.allowedWeekdays, ofs);
        ofs += 1;
        this.allowedFromTime.encode(buffer, ofs);
        ofs += 2;
        this.allowedToTime.encode(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AuthorizationEntryCommand {";
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n  idType: " + "0x" + this.idType.toString(16).padStart(2, "0");
        str += "\n  name: " + this.name;
        str += "\n  enabled: " + this.enabled;
        str += "\n  remoteAllowed: " + this.remoteAllowed;
        str += "\n  dateCreated: " + this.dateCreated.toString();
        str += "\n  dateLastActive: " + this.dateLastActive.toString();
        str += "\n  lockCount: " + "0x" + this.lockCount.toString(16).padStart(4, "0");
        str += "\n  timeLimited: " + this.timeLimited;
        str += "\n  allowedFromDate: " + this.allowedFromDate.toString();
        str += "\n  allowedUntilDate: " + this.allowedUntilDate.toString();
        str += "\n  allowedWeekdays: " + "0x" + this.allowedWeekdays.toString(16).padStart(2, "0");
        str += "\n  allowedFromTime: " + this.allowedFromTime.toString();
        str += "\n  allowedToTime: " + this.allowedToTime.toString();
        str += "\n}";
        return str;
    }
    
}
