import {Command} from "./Command";
import {CMD_KEYPAD_CODE_ID, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readDateTime, writeDateTime} from "./Util";

export class KeypadCodeIdCommand extends Command {
    
    readonly id = CMD_KEYPAD_CODE_ID;
    codeId: number;
    dateCreated: Date;

    constructor(codeId?: number, dateCreated?: Date) {
        super();
        this.codeId = codeId ?? 0;
        this.dateCreated = dateCreated ?? new Date();
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 9) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.codeId = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.dateCreated = readDateTime(buffer, ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(9);
        let ofs = 0;
        buffer.writeUInt16LE(this.codeId, ofs);
        ofs += 2;
        writeDateTime(buffer, this.dateCreated, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "KeypadCodeIdCommand {";
        str += "\n  codeId: " + "0x" + this.codeId.toString(16).padStart(4, "0");
        str += "\n  dateCreated: " + this.dateCreated.toISOString();
        str += "\n}";
        return str;
    }
    
}
