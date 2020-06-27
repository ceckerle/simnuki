import {Command} from "./Command";
import {CMD_TIME_CONTROL_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {Time} from "./Time";

export class TimeControlEntryCommand extends Command {
    
    readonly id = CMD_TIME_CONTROL_ENTRY;
    entryId: number;
    enabled: boolean;
    weekdays: number;
    time: Time;
    lockAction: number;

    constructor(entryId?: number, enabled?: boolean, weekdays?: number, time?: Time, lockAction?: number) {
        super();
        this.entryId = entryId ?? 0;
        this.enabled = enabled ?? false;
        this.weekdays = weekdays ?? 0;
        this.time = time ?? new Time(0, 0);
        this.lockAction = lockAction ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 6) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.entryId = buffer.readUInt8(ofs);
        ofs += 1;
        this.enabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.weekdays = buffer.readUInt8(ofs);
        ofs += 1;
        this.time = Time.decode(buffer, ofs);
        ofs += 2;
        this.lockAction = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(6);
        let ofs = 0;
        buffer.writeUInt8(this.entryId, ofs);
        ofs += 1;
        buffer.writeUInt8(this.enabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.weekdays, ofs);
        ofs += 1;
        this.time.encode(buffer, ofs);
        ofs += 2;
        buffer.writeUInt8(this.lockAction, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "TimeControlEntryCommand {";
        str += "\n  entryId: " + "0x" + this.entryId.toString(16).padStart(2, "0");
        str += "\n  enabled: " + this.enabled;
        str += "\n  weekdays: " + "0x" + this.weekdays.toString(16).padStart(2, "0");
        str += "\n  time: " + this.time.toString();
        str += "\n  lockAction: " + "0x" + this.lockAction.toString(16).padStart(2, "0");
        str += "\n}";
        return str;
    }
    
}
