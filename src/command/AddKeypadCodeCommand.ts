import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_ADD_KEYPAD_CODE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";
import {DateTime} from "./DateTime";
import {Time} from "./Time";

export class AddKeypadCodeCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_ADD_KEYPAD_CODE;
    code: number;
    name: string;
    timeLimited: boolean;
    allowedFromDate: DateTime;
    allowedUntilDate: DateTime;
    allowedWeekdays: number;
    allowedFromTime: Time;
    allowedToTime: Time;
    nonce: Buffer;
    securityPin: number;

    constructor(code?: number, name?: string, timeLimited?: boolean, allowedFromDate?: DateTime, allowedUntilDate?: DateTime, allowedWeekdays?: number, allowedFromTime?: Time, allowedToTime?: Time, nonce?: Buffer, securityPin?: number) {
        super();
        this.code = code ?? 0;
        this.name = name ?? "";
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
        const buffer = Buffer.alloc(78);
        let ofs = 0;
        buffer.writeUInt32LE(this.code, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 20);
        ofs += 20;
        buffer.writeUInt8(this.timeLimited ? 1 : 0, ofs);
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
        let str = "AddKeypadCodeCommand {";
        str += "\n  code: " + "0x" + this.code.toString(16).padStart(8, "0");
        str += "\n  name: " + this.name;
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
