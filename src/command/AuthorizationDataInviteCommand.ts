import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_AUTHORIZATION_DATA_INVITE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";
import {DateTime} from "./DateTime";
import {Time} from "./Time";

export class AuthorizationDataInviteCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_AUTHORIZATION_DATA_INVITE;
    name: string;
    idType: number;
    sharedKey: Buffer;
    remoteAllowed: boolean;
    timeLimited: boolean;
    allowedFromDate: DateTime;
    allowedUntilDate: DateTime;
    allowedWeekdays: number;
    allowedFromTime: Time;
    allowedToTime: Time;
    nonce: Buffer;
    securityPin: number;

    constructor(name?: string, idType?: number, sharedKey?: Buffer, remoteAllowed?: boolean, timeLimited?: boolean, allowedFromDate?: DateTime, allowedUntilDate?: DateTime, allowedWeekdays?: number, allowedFromTime?: Time, allowedToTime?: Time, nonce?: Buffer, securityPin?: number) {
        super();
        this.name = name ?? "";
        this.idType = idType ?? 0;
        this.sharedKey = sharedKey ?? Buffer.alloc(32);
        this.remoteAllowed = remoteAllowed ?? false;
        this.timeLimited = timeLimited ?? false;
        this.allowedFromDate = allowedFromDate ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.allowedUntilDate = allowedUntilDate ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.allowedWeekdays = allowedWeekdays ?? 0;
        this.allowedFromTime = allowedFromTime ?? new Time(0, 0);
        this.allowedToTime = allowedToTime ?? new Time(0, 0);
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 120) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.name = readString(buffer, ofs, 32);
        ofs += 32;
        this.idType = buffer.readUInt8(ofs);
        ofs += 1;
        this.sharedKey = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.remoteAllowed = buffer.readUInt8(ofs) === 1;
        ofs += 1;
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
        ofs += 2;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(120);
        let ofs = 0;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeUInt8(this.idType, ofs);
        ofs += 1;
        this.sharedKey.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt8(this.remoteAllowed === true ? 1 : 0, ofs);
        ofs += 1;
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
        ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AuthorizationDataInviteCommand {";
        str += "\n  name: " + this.name;
        str += "\n  idType: " + "0x" + this.idType.toString(16).padStart(2, "0");
        str += "\n  sharedKey: " + "0x" + this.sharedKey.toString("hex");
        str += "\n  remoteAllowed: " + this.remoteAllowed;
        str += "\n  timeLimited: " + this.timeLimited;
        str += "\n  allowedFromDate: " + this.allowedFromDate.toString();
        str += "\n  allowedUntilDate: " + this.allowedUntilDate.toString();
        str += "\n  allowedWeekdays: " + "0x" + this.allowedWeekdays.toString(16).padStart(2, "0");
        str += "\n  allowedFromTime: " + this.allowedFromTime.toString();
        str += "\n  allowedToTime: " + this.allowedToTime.toString();
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
