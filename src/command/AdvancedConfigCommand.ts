import {Command} from "./Command";
import {CMD_ADVANCED_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class AdvancedConfigCommand extends Command {
    
    readonly id = CMD_ADVANCED_CONFIG;
    totalDegrees: number;
    unlockedPositionOffsetDegrees: number;
    lockedPositionOffsetDegrees: number;
    singleLockedPositionOffsetDegrees: number;
    unlockedToLockedTransitionOffsetDegrees: number;
    lockngoTimeout: number;
    singleButtonPressAction: number;
    doubleButtonPressAction: number;
    detachedCylinder: boolean;
    batteryType: number;
    automaticBatteryTypeDetection: boolean;
    unlatchDuration: number;
    autoLockTimeout: number;
    autoUnlockDisabled: boolean;
    nightmodeEnabled: boolean;
    nightmodeStartTime: number;
    nightmodeEndTime: number;
    nightmodeAutoLockEnabled: boolean;
    nightmodeAutoUnlockDisabled: boolean;
    nightmodeImmediateLockOnStart: boolean;

    constructor(totalDegrees?: number, unlockedPositionOffsetDegrees?: number, lockedPositionOffsetDegrees?: number, singleLockedPositionOffsetDegrees?: number, unlockedToLockedTransitionOffsetDegrees?: number, lockngoTimeout?: number, singleButtonPressAction?: number, doubleButtonPressAction?: number, detachedCylinder?: boolean, batteryType?: number, automaticBatteryTypeDetection?: boolean, unlatchDuration?: number, autoLockTimeout?: number, autoUnlockDisabled?: boolean, nightmodeEnabled?: boolean, nightmodeStartTime?: number, nightmodeEndTime?: number, nightmodeAutoLockEnabled?: boolean, nightmodeAutoUnlockDisabled?: boolean, nightmodeImmediateLockOnStart?: boolean) {
        super();
        this.totalDegrees = totalDegrees ?? 0;
        this.unlockedPositionOffsetDegrees = unlockedPositionOffsetDegrees ?? 0;
        this.lockedPositionOffsetDegrees = lockedPositionOffsetDegrees ?? 0;
        this.singleLockedPositionOffsetDegrees = singleLockedPositionOffsetDegrees ?? 0;
        this.unlockedToLockedTransitionOffsetDegrees = unlockedToLockedTransitionOffsetDegrees ?? 0;
        this.lockngoTimeout = lockngoTimeout ?? 0;
        this.singleButtonPressAction = singleButtonPressAction ?? 0;
        this.doubleButtonPressAction = doubleButtonPressAction ?? 0;
        this.detachedCylinder = detachedCylinder ?? false;
        this.batteryType = batteryType ?? 0;
        this.automaticBatteryTypeDetection = automaticBatteryTypeDetection ?? false;
        this.unlatchDuration = unlatchDuration ?? 0;
        this.autoLockTimeout = autoLockTimeout ?? 0;
        this.autoUnlockDisabled = autoUnlockDisabled ?? false;
        this.nightmodeEnabled = nightmodeEnabled ?? false;
        this.nightmodeStartTime = nightmodeStartTime ?? 0;
        this.nightmodeEndTime = nightmodeEndTime ?? 0;
        this.nightmodeAutoLockEnabled = nightmodeAutoLockEnabled ?? false;
        this.nightmodeAutoUnlockDisabled = nightmodeAutoUnlockDisabled ?? false;
        this.nightmodeImmediateLockOnStart = nightmodeImmediateLockOnStart ?? false;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 28) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.totalDegrees = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.unlockedPositionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.lockedPositionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.singleLockedPositionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.unlockedToLockedTransitionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.lockngoTimeout = buffer.readUInt8(ofs);
        ofs += 1;
        this.singleButtonPressAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.doubleButtonPressAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.detachedCylinder = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.batteryType = buffer.readUInt8(ofs);
        ofs += 1;
        this.automaticBatteryTypeDetection = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.unlatchDuration = buffer.readUInt8(ofs);
        ofs += 1;
        this.autoLockTimeout = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.autoUnlockDisabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.nightmodeEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.nightmodeStartTime = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nightmodeEndTime = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nightmodeAutoLockEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.nightmodeAutoUnlockDisabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.nightmodeImmediateLockOnStart = buffer.readUInt8(ofs) === 1;
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(28);
        let ofs = 0;
        buffer.writeUInt16LE(this.totalDegrees, ofs);
        ofs += 2;
        buffer.writeInt16LE(this.unlockedPositionOffsetDegrees, ofs);
        ofs += 2;
        buffer.writeInt16LE(this.lockedPositionOffsetDegrees, ofs);
        ofs += 2;
        buffer.writeInt16LE(this.singleLockedPositionOffsetDegrees, ofs);
        ofs += 2;
        buffer.writeInt16LE(this.unlockedToLockedTransitionOffsetDegrees, ofs);
        ofs += 2;
        buffer.writeUInt8(this.lockngoTimeout, ofs);
        ofs += 1;
        buffer.writeUInt8(this.singleButtonPressAction, ofs);
        ofs += 1;
        buffer.writeUInt8(this.doubleButtonPressAction, ofs);
        ofs += 1;
        buffer.writeUInt8(this.detachedCylinder === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.batteryType, ofs);
        ofs += 1;
        buffer.writeUInt8(this.automaticBatteryTypeDetection === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.unlatchDuration, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.autoLockTimeout, ofs);
        ofs += 2;
        buffer.writeUInt8(this.autoUnlockDisabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.nightmodeEnabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.nightmodeStartTime, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.nightmodeEndTime, ofs);
        ofs += 2;
        buffer.writeUInt8(this.nightmodeAutoLockEnabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.nightmodeAutoUnlockDisabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.nightmodeImmediateLockOnStart === true ? 1 : 0, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AdvancedConfigCommand {";
        str += "\n  totalDegrees: " + "0x" + this.totalDegrees.toString(16).padStart(4, "0");
        str += "\n  unlockedPositionOffsetDegrees: " + "0x" + this.unlockedPositionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  lockedPositionOffsetDegrees: " + "0x" + this.lockedPositionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  singleLockedPositionOffsetDegrees: " + "0x" + this.singleLockedPositionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  unlockedToLockedTransitionOffsetDegrees: " + "0x" + this.unlockedToLockedTransitionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  lockngoTimeout: " + "0x" + this.lockngoTimeout.toString(16).padStart(2, "0");
        str += "\n  singleButtonPressAction: " + "0x" + this.singleButtonPressAction.toString(16).padStart(2, "0");
        str += "\n  doubleButtonPressAction: " + "0x" + this.doubleButtonPressAction.toString(16).padStart(2, "0");
        str += "\n  detachedCylinder: " + this.detachedCylinder;
        str += "\n  batteryType: " + "0x" + this.batteryType.toString(16).padStart(2, "0");
        str += "\n  automaticBatteryTypeDetection: " + this.automaticBatteryTypeDetection;
        str += "\n  unlatchDuration: " + "0x" + this.unlatchDuration.toString(16).padStart(2, "0");
        str += "\n  autoLockTimeout: " + "0x" + this.autoLockTimeout.toString(16).padStart(4, "0");
        str += "\n  autoUnlockDisabled: " + this.autoUnlockDisabled;
        str += "\n  nightmodeEnabled: " + this.nightmodeEnabled;
        str += "\n  nightmodeStartTime: " + "0x" + this.nightmodeStartTime.toString(16).padStart(4, "0");
        str += "\n  nightmodeEndTime: " + "0x" + this.nightmodeEndTime.toString(16).padStart(4, "0");
        str += "\n  nightmodeAutoLockEnabled: " + this.nightmodeAutoLockEnabled;
        str += "\n  nightmodeAutoUnlockDisabled: " + this.nightmodeAutoUnlockDisabled;
        str += "\n  nightmodeImmediateLockOnStart: " + this.nightmodeImmediateLockOnStart;
        str += "\n}";
        return str;
    }
    
}
