import {CommandNeedsChallenge} from "./CommandNeedsChallenge";
import {CMD_LOCK_ACTION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";

export class LockActionCommand extends CommandNeedsChallenge {
    
    readonly id = CMD_LOCK_ACTION;
    lockAction: number;
    appId: number;
    flags: number;
    nameSuffix?: string;
    nonce: Buffer;

    constructor(lockAction?: number, appId?: number, flags?: number, nameSuffix?: string, nonce?: Buffer) {
        super();
        this.lockAction = lockAction ?? 0;
        this.appId = appId ?? 0;
        this.flags = flags ?? 0;
        this.nameSuffix = nameSuffix;
        this.nonce = nonce ?? Buffer.alloc(32);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 38 && buffer.length !== 58) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.lockAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.appId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.flags = buffer.readUInt8(ofs);
        ofs += 1;
        if (buffer.length > 38) {
            this.nameSuffix = readString(buffer, ofs, 20);
            ofs += 20;
        }
        this.nonce = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(58);
        let ofs = 0;
        buffer.writeUInt8(this.lockAction, ofs);
        ofs += 1;
        buffer.writeUInt32LE(this.appId, ofs);
        ofs += 4;
        buffer.writeUInt8(this.flags, ofs);
        ofs += 1;
        if (this.nameSuffix !== undefined) {
            writeString(buffer, this.nameSuffix, ofs, 20);
            ofs += 20;
        }
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        return buffer.slice(0, ofs);
    }
    
    toString(): string {
        let str = "LockActionCommand {";
        str += "\n  lockAction: " + "0x" + this.lockAction.toString(16).padStart(2, "0");
        str += "\n  appId: " + "0x" + this.appId.toString(16).padStart(8, "0");
        str += "\n  flags: " + "0x" + this.flags.toString(16).padStart(2, "0");
        if (this.nameSuffix !== undefined) {
            str += "\n  nameSuffix: " + this.nameSuffix;
        }
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n}";
        return str;
    }
    
}
