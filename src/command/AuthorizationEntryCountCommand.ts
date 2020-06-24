import {Command} from "./Command";
import {CMD_AUTHORIZATION_ENTRY_COUNT, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class AuthorizationEntryCountCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_ENTRY_COUNT;
    count: number;

    constructor(count?: number) {
        super();
        this.count = count ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 2) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.count = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(2);
        const ofs = 0;
        buffer.writeUInt16LE(this.count, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AuthorizationEntryCountCommand {";
        str += "\n  count: " + "0x" + this.count.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
