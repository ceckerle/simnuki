import {Command} from "./Command";
import {CMD_ERROR, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class ErrorCommand extends Command {
    
    readonly id = CMD_ERROR;
    errorCode: number;
    commandId: number;
    message?: string;

    constructor(errorCode?: number, commandId?: number, message?: string) {
        super();
        this.errorCode = errorCode ?? 0;
        this.commandId = commandId ?? 0;
        this.message = message;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 3) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.errorCode = buffer.readUInt8(ofs);
        ofs += 1;
        this.commandId = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(3);
        let ofs = 0;
        buffer.writeUInt8(this.errorCode, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.commandId, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "ErrorCommand {";
        str += "\n  errorCode: " + "0x" + this.errorCode.toString(16).padStart(2, "0");
        str += "\n  commandId: " + "0x" + this.commandId.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
