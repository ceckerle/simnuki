import {Command} from "./Command";
import {CMD_REQUEST_DATA, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RequestDataCommand extends Command {
    
    readonly id = CMD_REQUEST_DATA;
    commandId: number;
    additionalData: Buffer;

    constructor(commandId?: number, additionalData?: Buffer) {
        super();
        this.commandId = commandId ?? 0;
        this.additionalData = additionalData ?? Buffer.alloc(0);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length < 2) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.commandId = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.additionalData = buffer.slice(ofs, buffer.length);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(2 + this.additionalData.length);
        let ofs = 0;
        buffer.writeUInt16LE(this.commandId, ofs);
        ofs += 2;
        this.additionalData.copy(buffer, ofs);
        return buffer;
    }
    
}
