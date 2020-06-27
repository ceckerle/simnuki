import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_UPDATE_TIME, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {DateTime} from "./DateTime";

export class UpdateTimeCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_UPDATE_TIME;
    time: DateTime;
    nonce: Buffer;
    securityPin: number;

    constructor(time?: DateTime, nonce?: Buffer, securityPin?: number) {
        super();
        this.time = time ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 41) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.time = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(41);
        let ofs = 0;
        this.time.encode(buffer, ofs);
        ofs += 7;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "UpdateTimeCommand {";
        str += "\n  time: " + this.time.toString();
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
