import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_SET_HOME_KIT_CONFIGURATION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class SetHomeKitConfigurationCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_SET_HOME_KIT_CONFIGURATION;
    configuration: number;
    nonce: Buffer;
    securityPin: number;

    constructor(configuration?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.configuration = configuration ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 36) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.configuration = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(36);
        let ofs = 0;
        buffer.writeUInt16LE(this.configuration, ofs);
        ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "SetHomeKitConfigurationCommand {";
        str += "\n  configuration: " + "0x" + this.configuration.toString(16).padStart(4, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
