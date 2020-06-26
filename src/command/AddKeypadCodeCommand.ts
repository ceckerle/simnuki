import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_ADD_KEYPAD_CODE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString, readDateTime, writeDateTime} from "./Util";

export class AddKeypadCodeCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_ADD_KEYPAD_CODE;
    code: number;
    name: string;
    timeLimited: boolean;
    allowedFromDate: Date;
    allowedUntilDate: Date;
    allowedWeekdays: number;
    allowedFromTime: number;
    allowedToTime: number;
    nonce: Buffer;
    securityPin: number;

    constructor(code?: number, name?: string, timeLimited?: boolean, allowedFromDate?: Date, allowedUntilDate?: Date, allowedWeekdays?: number, allowedFromTime?: number, allowedToTime?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.code = code ?? 0;
        this.name = name ?? "";
        this.timeLimited = timeLimited ?? false;
        this.allowedFromDate = allowedFromDate ?? new Date();
        this.allowedUntilDate = allowedUntilDate ?? new Date();
        this.allowedWeekdays = allowedWeekdays ?? 0;
        this.allowedFromTime = allowedFromTime ?? 0;
        this.allowedToTime = allowedToTime ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 78) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.code = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.name = readString(buffer, ofs, 20);
        ofs += 20;
        this.timeLimited = buffer.readUInt8(ofs) === 1;
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
        const buffer = Buffer.alloc(78);
        let ofs = 0;
        buffer.writeUInt32LE(this.code, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 20);
        ofs += 20;
        buffer.writeUInt8(this.timeLimited === true ? 1 : 0, ofs);
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
        let str = "AddKeypadCodeCommand {";
        str += "\n  code: " + "0x" + this.code.toString(16).padStart(8, "0");
        str += "\n  name: " + this.name;
        str += "\n  timeLimited: " + this.timeLimited;
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
