import {Command} from "./Command";
import {CMD_KEYTURNER_STATES, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readDateTime, writeDateTime} from "./Util";

export class KeyturnerStatesCommand extends Command {
    
    readonly id = CMD_KEYTURNER_STATES;
    nukState: number;
    lockState: number;
    trigger: number;
    currentTime: Date;
    timezoneOffset: number;
    criticalBatteryState: number;
    configUpdateCount: number;
    lockngoTimer: number;
    lastLockAction: number;
    lastLockActionTrigger: number;
    lastLockActionCompletionState: number;
    doorSensorState: number;

    constructor(nukState?: number, lockState?: number, trigger?: number, currentTime?: Date, timezoneOffset?: number, criticalBatteryState?: number, configUpdateCount?: number, lockngoTimer?: number, lastLockAction?: number, lastLockActionTrigger?: number, lastLockActionCompletionState?: number, doorSensorState?: number) {
        super();
        this.nukState = nukState ?? 0;
        this.lockState = lockState ?? 0;
        this.trigger = trigger ?? 0;
        this.currentTime = currentTime ?? new Date();
        this.timezoneOffset = timezoneOffset ?? 0;
        this.criticalBatteryState = criticalBatteryState ?? 0;
        this.configUpdateCount = configUpdateCount ?? 0;
        this.lockngoTimer = lockngoTimer ?? 0;
        this.lastLockAction = lastLockAction ?? 0;
        this.lastLockActionTrigger = lastLockActionTrigger ?? 0;
        this.lastLockActionCompletionState = lastLockActionCompletionState ?? 0;
        this.doorSensorState = doorSensorState ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 19) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.nukState = buffer.readUInt8(ofs);
        ofs += 1;
        this.lockState = buffer.readUInt8(ofs);
        ofs += 1;
        this.trigger = buffer.readUInt8(ofs);
        ofs += 1;
        this.currentTime = readDateTime(buffer, ofs);
        ofs += 7;
        this.timezoneOffset = buffer.readInt16LE(ofs);
        ofs += 2;
        this.criticalBatteryState = buffer.readUInt8(ofs);
        ofs += 1;
        this.configUpdateCount = buffer.readUInt8(ofs);
        ofs += 1;
        this.lockngoTimer = buffer.readUInt8(ofs);
        ofs += 1;
        this.lastLockAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.lastLockActionTrigger = buffer.readUInt8(ofs);
        ofs += 1;
        this.lastLockActionCompletionState = buffer.readUInt8(ofs);
        ofs += 1;
        this.doorSensorState = buffer.readUInt8(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(19);
        let ofs = 0;
        buffer.writeUInt8(this.nukState, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lockState, ofs);
        ofs += 1;
        buffer.writeUInt8(this.trigger, ofs);
        ofs += 1;
        writeDateTime(buffer, this.currentTime, ofs);
        ofs += 7;
        buffer.writeInt16LE(this.timezoneOffset, ofs);
        ofs += 2;
        buffer.writeUInt8(this.criticalBatteryState, ofs);
        ofs += 1;
        buffer.writeUInt8(this.configUpdateCount, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lockngoTimer, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lastLockAction, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lastLockActionTrigger, ofs);
        ofs += 1;
        buffer.writeUInt8(this.lastLockActionCompletionState, ofs);
        ofs += 1;
        buffer.writeUInt8(this.doorSensorState, ofs);
        return buffer;
    }
    
}
