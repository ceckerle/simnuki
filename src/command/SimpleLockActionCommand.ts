import {CommandNeedsChallenge} from "./CommandNeedsChallenge";
import {CMD_SIMPLE_LOCK_ACTION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class SimpleLockActionCommand extends CommandNeedsChallenge {
    
    readonly id = CMD_SIMPLE_LOCK_ACTION;
    lockAction: number;
    nonce: Buffer;

    constructor(lockAction?: number, nonce?: Buffer) {
        super();
        this.lockAction = lockAction ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 33) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.lockAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(33);
        let ofs = 0;
        buffer.writeUInt8(this.lockAction, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        return buffer;
    }
    
}
