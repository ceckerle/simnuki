import {Command} from "./Command";
import {CMD_PUBLIC_KEY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class PublicKeyCommand extends Command {
    
    readonly id = CMD_PUBLIC_KEY;
    publicKey: Buffer;

    constructor(publicKey?: Buffer) {
        super();
        this.publicKey = publicKey ?? Buffer.alloc(32);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 32) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.publicKey = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(32);
        const ofs = 0;
        this.publicKey.copy(buffer, ofs);
        return buffer;
    }
    
}
