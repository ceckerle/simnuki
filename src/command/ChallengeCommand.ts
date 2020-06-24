import {Command} from "./Command";
import {CMD_CHALLENGE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class ChallengeCommand extends Command {
    
    readonly id = CMD_CHALLENGE;
    nonce: Buffer;

    constructor(nonce?: Buffer) {
        super();
        this.nonce = nonce ?? Buffer.alloc(32);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 32) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.nonce = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(32);
        const ofs = 0;
        this.nonce.copy(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "ChallengeCommand {";
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n}";
        return str;
    }
    
}
