import {Command} from "./Command";
import {CMD_TIME_CONTROL_ENTRY_COUNT, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class TimeControlEntryCountCommand extends Command {
    
    readonly id = CMD_TIME_CONTROL_ENTRY_COUNT;
    count: number;

    constructor(count?: number) {
        super();
        this.count = count ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 1) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.count = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(1);
        const ofs = 0;
        buffer.writeUInt8(this.count, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "TimeControlEntryCountCommand {";
        str += "\n  count: " + "0x" + this.count.toString(16).padStart(2, "0");
        str += "\n}";
        return str;
    }
    
}
