import {Command} from "./Command";
import {CMD_DOOR_SENSOR_CONFIGURATION, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class DoorSensorConfigurationCommand extends Command {
    
    readonly id = CMD_DOOR_SENSOR_CONFIGURATION;
    enabled: boolean;
    unlockedDoorOpenWarningTime: number;
    unlockedDoorOpenWarningEnable: boolean;
    lockedDoorOpenWarningEnabled: boolean;

    constructor(enabled?: boolean, unlockedDoorOpenWarningTime?: number, unlockedDoorOpenWarningEnable?: boolean, lockedDoorOpenWarningEnabled?: boolean) {
        super();
        this.enabled = enabled ?? false;
        this.unlockedDoorOpenWarningTime = unlockedDoorOpenWarningTime ?? 0;
        this.unlockedDoorOpenWarningEnable = unlockedDoorOpenWarningEnable ?? false;
        this.lockedDoorOpenWarningEnabled = lockedDoorOpenWarningEnabled ?? false;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 4) {
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
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(4);
        let ofs = 0;
        buffer.writeUInt8(this.enabled ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.unlockedDoorOpenWarningTime, ofs);
        ofs += 1;
        buffer.writeUInt8(this.unlockedDoorOpenWarningEnable ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lockedDoorOpenWarningEnabled ? 1 : 0, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "DoorSensorConfigurationCommand {";
        str += "\n  enabled: " + this.enabled;
        str += "\n  unlockedDoorOpenWarningTime: " + "0x" + this.unlockedDoorOpenWarningTime.toString(16).padStart(2, "0");
        str += "\n  unlockedDoorOpenWarningEnable: " + this.unlockedDoorOpenWarningEnable;
        str += "\n  lockedDoorOpenWarningEnabled: " + this.lockedDoorOpenWarningEnabled;
        str += "\n}";
        return str;
    }
    
}
