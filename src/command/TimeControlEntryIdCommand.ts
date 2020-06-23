import {Command} from "./Command";
import {CMD_TIME_CONTROL_ENTRY_ID, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class TimeControlEntryIdCommand extends Command {
    
    readonly id = CMD_TIME_CONTROL_ENTRY_ID;
    entryId: number;

    constructor(entryId?: number) {
        super();
        this.entryId = entryId ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 1) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.entryId = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(1);
        const ofs = 0;
        buffer.writeUInt8(this.entryId, ofs);
        return buffer;
    }
    
}
