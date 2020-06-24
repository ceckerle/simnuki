import {CommandNeedsChallenge} from "./CommandNeedsChallenge";
import {CMD_REQUEST_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RequestConfigCommand extends CommandNeedsChallenge {
    
    readonly id = CMD_REQUEST_CONFIG;
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
    
}
