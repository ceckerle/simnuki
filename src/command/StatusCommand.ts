import {Command} from "./Command";
import {CMD_STATUS, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class StatusCommand extends Command {
    
    readonly id = CMD_STATUS;
    status: number;

    constructor(status?: number) {
        super();
        this.status = status ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 1) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.status = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(1);
        const ofs = 0;
        buffer.writeUInt8(this.status, ofs);
        return buffer;
    }
    
}
