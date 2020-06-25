import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_UPDATE_AUTHORIZATION_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString, readDateTime, writeDateTime} from "./Util";

export class UpdateAuthorizationEntryCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_UPDATE_AUTHORIZATION_ENTRY;
    authorizationId: number;
    name: string;
    enabled: number;
    remoteAllowed: number;
    timeLimited: number;
    allowedFromDate: Date;
    allowedUntilDate: Date;
    allowedWeekdays: number;
    allowedFromTime: number;
    allowedToTime: number;
    nonce: Buffer;
    securityPin: number;

    constructor(authorizationId?: number, name?: string, enabled?: number, remoteAllowed?: number, timeLimited?: number, allowedFromDate?: Date, allowedUntilDate?: Date, allowedWeekdays?: number, allowedFromTime?: number, allowedToTime?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.authorizationId = authorizationId ?? 0;
        this.name = name ?? "";
        this.enabled = enabled ?? 0;
        this.remoteAllowed = remoteAllowed ?? 0;
        this.timeLimited = timeLimited ?? 0;
        this.allowedFromDate = allowedFromDate ?? new Date();
        this.allowedUntilDate = allowedUntilDate ?? new Date();
        this.allowedWeekdays = allowedWeekdays ?? 0;
        this.allowedFromTime = allowedFromTime ?? 0;
        this.allowedToTime = allowedToTime ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 92) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authorizationId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.name = readString(buffer, ofs, 32);
        ofs += 32;
        this.enabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.remoteAllowed = buffer.readUInt8(ofs);
        ofs += 1;
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
        ofs += 2;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(92);
        let ofs = 0;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeUInt8(this.enabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.remoteAllowed, ofs);
        ofs += 1;
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
        ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "UpdateAuthorizationEntryCommand {";
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n  name: " + this.name;
        str += "\n  enabled: " + "0x" + this.enabled.toString(16).padStart(2, "0");
        str += "\n  remoteAllowed: " + "0x" + this.remoteAllowed.toString(16).padStart(2, "0");
        str += "\n  timeLimited: " + "0x" + this.timeLimited.toString(16).padStart(2, "0");
        str += "\n  allowedFromDate: " + this.allowedFromDate.toISOString();
        str += "\n  allowedUntilDate: " + this.allowedUntilDate.toISOString();
        str += "\n  allowedWeekdays: " + "0x" + this.allowedWeekdays.toString(16).padStart(2, "0");
        str += "\n  allowedFromTime: " + "0x" + this.allowedFromTime.toString(16).padStart(4, "0");
        str += "\n  allowedToTime: " + "0x" + this.allowedToTime.toString(16).padStart(4, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
