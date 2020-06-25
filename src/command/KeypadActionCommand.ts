import {CommandNeedsChallenge} from "./CommandNeedsChallenge";
import {CMD_KEYPAD_ACTION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class KeypadActionCommand extends CommandNeedsChallenge {
    
    readonly id = CMD_KEYPAD_ACTION;
    source: number;
    code: number;
    action: number;
    nonce: Buffer;

    constructor(source?: number, code?: number, action?: number, nonce?: Buffer) {
        super();
        this.source = source ?? 0;
        this.code = code ?? 0;
        this.action = action ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 38) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.source = buffer.readUInt8(ofs);
        ofs += 1;
        this.code = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.action = buffer.readUInt8(ofs);
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(38);
        let ofs = 0;
        buffer.writeUInt8(this.source, ofs);
        ofs += 1;
        buffer.writeUInt32LE(this.code, ofs);
        ofs += 4;
        buffer.writeUInt8(this.action, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "KeypadActionCommand {";
        str += "\n  source: " + "0x" + this.source.toString(16).padStart(2, "0");
        str += "\n  code: " + "0x" + this.code.toString(16).padStart(8, "0");
        str += "\n  action: " + "0x" + this.action.toString(16).padStart(2, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n}";
        return str;
    }
    
}
