import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_REQUEST_CALIBRATION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class RequestCalibrationCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_REQUEST_CALIBRATION;
    nonce: Buffer;
    securityPin: number;

    constructor(nonce?: Buffer, securityPin?: number) {
        super();
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 34) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(34);
        let ofs = 0;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
}
