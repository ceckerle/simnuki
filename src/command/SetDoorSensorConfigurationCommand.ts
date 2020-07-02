import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_SET_DOOR_SENSOR_CONFIGURATION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class SetDoorSensorConfigurationCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_SET_DOOR_SENSOR_CONFIGURATION;
    enabled: boolean;
    unlockedDoorOpenWarningTime: number;
    unlockedDoorOpenWarningEnable: boolean;
    lockedDoorOpenWarningEnabled: boolean;
    nonce: Buffer;
    securityPin: number;

    constructor(enabled?: boolean, unlockedDoorOpenWarningTime?: number, unlockedDoorOpenWarningEnable?: boolean, lockedDoorOpenWarningEnabled?: boolean, nonce?: Buffer, securityPin?: number) {
        super();
        this.enabled = enabled ?? false;
        this.unlockedDoorOpenWarningTime = unlockedDoorOpenWarningTime ?? 0;
        this.unlockedDoorOpenWarningEnable = unlockedDoorOpenWarningEnable ?? false;
        this.lockedDoorOpenWarningEnabled = lockedDoorOpenWarningEnabled ?? false;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 38) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.enabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.unlockedDoorOpenWarningTime = buffer.readUInt8(ofs);
        ofs += 1;
        this.unlockedDoorOpenWarningEnable = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.lockedDoorOpenWarningEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(38);
        let ofs = 0;
        buffer.writeUInt8(this.enabled ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.unlockedDoorOpenWarningTime, ofs);
        ofs += 1;
        buffer.writeUInt8(this.unlockedDoorOpenWarningEnable ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lockedDoorOpenWarningEnabled ? 1 : 0, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "SetDoorSensorConfigurationCommand {";
        str += "\n  enabled: " + this.enabled;
        str += "\n  unlockedDoorOpenWarningTime: " + "0x" + this.unlockedDoorOpenWarningTime.toString(16).padStart(2, "0");
        str += "\n  unlockedDoorOpenWarningEnable: " + this.unlockedDoorOpenWarningEnable;
        str += "\n  lockedDoorOpenWarningEnabled: " + this.lockedDoorOpenWarningEnabled;
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
