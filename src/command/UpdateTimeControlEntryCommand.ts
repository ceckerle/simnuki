import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_UPDATE_TIME_CONTROL_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {Time} from "./Time";

export class UpdateTimeControlEntryCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_UPDATE_TIME_CONTROL_ENTRY;
    entryId: number;
    enabled: boolean;
    weekdays: number;
    time: Time;
    lockAction: number;
    nonce: Buffer;
    securityPin: number;

    constructor(entryId?: number, enabled?: boolean, weekdays?: number, time?: Time, lockAction?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.entryId = entryId ?? 0;
        this.enabled = enabled ?? false;
        this.weekdays = weekdays ?? 0;
        this.time = time ?? new Time(0, 0);
        this.lockAction = lockAction ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 40) {
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
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(40);
        let ofs = 0;
        buffer.writeUInt8(this.entryId, ofs);
        ofs += 1;
        buffer.writeUInt8(this.enabled ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.weekdays, ofs);
        ofs += 1;
        this.time.encode(buffer, ofs);
        ofs += 2;
        buffer.writeUInt8(this.lockAction, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "UpdateTimeControlEntryCommand {";
        str += "\n  entryId: " + "0x" + this.entryId.toString(16).padStart(2, "0");
        str += "\n  enabled: " + this.enabled;
        str += "\n  weekdays: " + "0x" + this.weekdays.toString(16).padStart(2, "0");
        str += "\n  time: " + this.time.toString();
        str += "\n  lockAction: " + "0x" + this.lockAction.toString(16).padStart(2, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
