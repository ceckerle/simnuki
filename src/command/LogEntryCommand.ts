import {Command} from "./Command";
import {CMD_LOG_ENTRY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";
import {DateTime} from "./DateTime";

export class LogEntryCommand extends Command {
    
    readonly id = CMD_LOG_ENTRY;
    index: number;
    timestamp: DateTime;
    authorizationId: number;
    name: string;
    type: number;
    data: Buffer;

    constructor(index?: number, timestamp?: DateTime, authorizationId?: number, name?: string, type?: number, data?: Buffer) {
        super();
        this.index = index ?? 0;
        this.timestamp = timestamp ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.authorizationId = authorizationId ?? 0;
        this.name = name ?? "";
        this.type = type ?? 0;
        this.data = data ?? Buffer.alloc(0);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length < 20) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.index = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.timestamp = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.authorizationId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.name = readString(buffer, ofs, 32);
        ofs += 32;
        this.type = buffer.readUInt8(ofs);
        ofs += 1;
        this.data = buffer.slice(ofs, buffer.length);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(48 + this.data.length);
        let ofs = 0;
        buffer.writeUInt32LE(this.index, ofs);
        ofs += 4;
        this.timestamp.encode(buffer, ofs);
        ofs += 7;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeUInt8(this.type, ofs);
        ofs += 1;
        this.data.copy(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "LogEntryCommand {";
        str += "\n  index: " + "0x" + this.index.toString(16).padStart(8, "0");
        str += "\n  timestamp: " + this.timestamp.toString();
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n  name: " + this.name;
        str += "\n  type: " + "0x" + this.type.toString(16).padStart(2, "0");
        str += "\n  data: " + "0x" + this.data.toString("hex");
        str += "\n}";
        return str;
    }
    
}
