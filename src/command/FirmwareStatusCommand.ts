import {Command} from "./Command";
import {CMD_FIRMWARE_STATUS, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readUInt24BE, writeUInt24BE} from "./Util";

export class FirmwareStatusCommand extends Command {
    
    readonly id = CMD_FIRMWARE_STATUS;
    version: number;
    data: Buffer;

    constructor(version?: number, data?: Buffer) {
        super();
        this.version = version ?? 0;
        this.data = data ?? Buffer.alloc(5);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 8) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.version = readUInt24BE(buffer, ofs);
        ofs += 3;
        this.data = buffer.slice(ofs, ofs + 5);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(8);
        let ofs = 0;
        writeUInt24BE(buffer, this.version, ofs);
        ofs += 3;
        this.data.copy(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "FirmwareStatusCommand {";
        str += "\n  version: " + "0x" + this.version.toString(16).padStart(6, "0");
        str += "\n  data: " + "0x" + this.data.toString("hex");
        str += "\n}";
        return str;
    }
    
}
