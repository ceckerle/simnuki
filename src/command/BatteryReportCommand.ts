import {Command} from "./Command";
import {CMD_BATTERY_REPORT, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class BatteryReportCommand extends Command {
    
    readonly id = CMD_BATTERY_REPORT;
    batteryDrain: number;
    batteryVoltage: number;
    criticalBatteryState: number;
    locakAction: number;
    startVoltage: number;
    lowestVoltage: number;
    lockDistance: number;
    startTemperature: number;
    maxTurnCurrent: number;
    batteryResistance: number;

    constructor(batteryDrain?: number, batteryVoltage?: number, criticalBatteryState?: number, locakAction?: number, startVoltage?: number, lowestVoltage?: number, lockDistance?: number, startTemperature?: number, maxTurnCurrent?: number, batteryResistance?: number) {
        super();
        this.batteryDrain = batteryDrain ?? 0;
        this.batteryVoltage = batteryVoltage ?? 0;
        this.criticalBatteryState = criticalBatteryState ?? 0;
        this.locakAction = locakAction ?? 0;
        this.startVoltage = startVoltage ?? 0;
        this.lowestVoltage = lowestVoltage ?? 0;
        this.lockDistance = lockDistance ?? 0;
        this.startTemperature = startTemperature ?? 0;
        this.maxTurnCurrent = maxTurnCurrent ?? 0;
        this.batteryResistance = batteryResistance ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 17) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.batteryDrain = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.batteryVoltage = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.criticalBatteryState = buffer.readUInt8(ofs);
        ofs += 1;
        this.locakAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.startVoltage = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.lowestVoltage = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.lockDistance = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.startTemperature = buffer.readInt8(ofs);
        ofs += 1;
        this.maxTurnCurrent = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.batteryResistance = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(17);
        let ofs = 0;
        buffer.writeUInt16LE(this.batteryDrain, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.batteryVoltage, ofs);
        ofs += 2;
        buffer.writeUInt8(this.criticalBatteryState, ofs);
        ofs += 1;
        buffer.writeUInt8(this.locakAction, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.startVoltage, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.lowestVoltage, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.lockDistance, ofs);
        ofs += 2;
        buffer.writeInt8(this.startTemperature, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.maxTurnCurrent, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.batteryResistance, ofs);
        return buffer;
    }
    
}
