import {Command} from "./Command";
import {CMD_LOG_ENTRY_COUNT, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class LogEntryCountCommand extends Command {
    
    readonly id = CMD_LOG_ENTRY_COUNT;
    loggingEnabled: number;
    count: number;
    doorSensorEnabled: number;
    doorSensorLoggingEnabled: number;

    constructor(loggingEnabled?: number, count?: number, doorSensorEnabled?: number, doorSensorLoggingEnabled?: number) {
        super();
        this.loggingEnabled = loggingEnabled ?? 0;
        this.count = count ?? 0;
        this.doorSensorEnabled = doorSensorEnabled ?? 0;
        this.doorSensorLoggingEnabled = doorSensorLoggingEnabled ?? 0;
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
        this.doorSensorEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.doorSensorLoggingEnabled = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(5);
        let ofs = 0;
        buffer.writeUInt8(this.loggingEnabled, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.count, ofs);
        ofs += 2;
        buffer.writeUInt8(this.doorSensorEnabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.doorSensorLoggingEnabled, ofs);
        return buffer;
    }
    
}
