import {Command} from "./Command";
import {CMD_KEYPAD_CODE_ID, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {DateTime} from "./DateTime";

export class KeypadCodeIdCommand extends Command {
    
    readonly id = CMD_KEYPAD_CODE_ID;
    codeId: number;
    dateCreated: DateTime;

    constructor(codeId?: number, dateCreated?: DateTime) {
        super();
        this.codeId = codeId ?? 0;
        this.dateCreated = dateCreated ?? new DateTime(0, 0, 0, 0, 0, 0);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 9) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.codeId = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.dateCreated = DateTime.decode(buffer, ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(9);
        let ofs = 0;
        buffer.writeUInt16LE(this.codeId, ofs);
        ofs += 2;
        this.dateCreated.encode(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "KeypadCodeIdCommand {";
        str += "\n  codeId: " + "0x" + this.codeId.toString(16).padStart(4, "0");
        str += "\n  dateCreated: " + this.dateCreated.toString();
        str += "\n}";
        return str;
    }
    
}
