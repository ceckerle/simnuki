import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_REMVE_KEYPAD_CODE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RemveKeypadCodeCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_REMVE_KEYPAD_CODE;
    codeId: number;
    nonce: Buffer;
    securityPin: number;

    constructor(codeId?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.codeId = codeId ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 36) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.codeId = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(36);
        let ofs = 0;
        buffer.writeUInt16LE(this.codeId, ofs);
        ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "RemveKeypadCodeCommand {";
        str += "\n  codeId: " + "0x" + this.codeId.toString(16).padStart(4, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
