import {Command} from "./Command";
import {CMD_LOG_ENTRY_COUNT, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class LogEntryCountCommand extends Command {
    
    readonly id = CMD_LOG_ENTRY_COUNT;
    loggingEnabled: number;
    count: number;
    doorSensorEnabled: boolean;
    doorSensorLoggingEnabled: boolean;

    constructor(loggingEnabled?: number, count?: number, doorSensorEnabled?: boolean, doorSensorLoggingEnabled?: boolean) {
        super();
        this.loggingEnabled = loggingEnabled ?? 0;
        this.count = count ?? 0;
        this.doorSensorEnabled = doorSensorEnabled ?? false;
        this.doorSensorLoggingEnabled = doorSensorLoggingEnabled ?? false;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 5) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.loggingEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.count = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.doorSensorEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.doorSensorLoggingEnabled = buffer.readUInt8(ofs) === 1;
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(5);
        let ofs = 0;
        buffer.writeUInt8(this.loggingEnabled, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.count, ofs);
        ofs += 2;
        buffer.writeUInt8(this.doorSensorEnabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.doorSensorLoggingEnabled === true ? 1 : 0, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "LogEntryCountCommand {";
        str += "\n  loggingEnabled: " + "0x" + this.loggingEnabled.toString(16).padStart(2, "0");
        str += "\n  count: " + "0x" + this.count.toString(16).padStart(4, "0");
        str += "\n  doorSensorEnabled: " + this.doorSensorEnabled;
        str += "\n  doorSensorLoggingEnabled: " + this.doorSensorLoggingEnabled;
        str += "\n}";
        return str;
    }
    
}
