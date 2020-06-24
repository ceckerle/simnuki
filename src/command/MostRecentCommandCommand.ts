import {Command} from "./Command";
import {CMD_MOST_RECENT_COMMAND, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class MostRecentCommandCommand extends Command {
    
    readonly id = CMD_MOST_RECENT_COMMAND;
    commandId: number;

    constructor(commandId?: number) {
        super();
        this.commandId = commandId ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 2) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.commandId = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(2);
        const ofs = 0;
        buffer.writeUInt16LE(this.commandId, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "MostRecentCommandCommand {";
        str += "\n  commandId: " + "0x" + this.commandId.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
