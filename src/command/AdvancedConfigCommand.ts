import {Command} from "./Command";
import {CMD_ADVANCED_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {Time} from "./Time";

export class AdvancedConfigCommand extends Command {
    
    readonly id = CMD_ADVANCED_CONFIG;
    totalDegrees: number;
    unlockedPositionOffsetDegrees: number;
    lockedPositionOffsetDegrees: number;
    singleLockedPositionOffsetDegrees: number;
    unlockedToLockedTransitionOffsetDegrees: number;
    lockngoTimeout?: number;
    singleButtonPressAction?: number;
    doubleButtonPressAction?: number;
    detachedCylinder?: boolean;
    batteryType?: number;
    automaticBatteryTypeDetection?: boolean;
    unlatchDuration?: number;
    autoLockTimeout?: number;
    autoUnlockDisabled?: boolean;
    nightmodeEnabled?: boolean;
    nightmodeStartTime?: Time;
    nightmodeEndTime?: Time;
    nightmodeAutoLockEnabled?: boolean;
    nightmodeAutoUnlockDisabled?: boolean;
    nightmodeImmediateLockOnStart?: boolean;

    constructor(totalDegrees?: number, unlockedPositionOffsetDegrees?: number, lockedPositionOffsetDegrees?: number, singleLockedPositionOffsetDegrees?: number, unlockedToLockedTransitionOffsetDegrees?: number, lockngoTimeout?: number, singleButtonPressAction?: number, doubleButtonPressAction?: number, detachedCylinder?: boolean, batteryType?: number, automaticBatteryTypeDetection?: boolean, unlatchDuration?: number, autoLockTimeout?: number, autoUnlockDisabled?: boolean, nightmodeEnabled?: boolean, nightmodeStartTime?: Time, nightmodeEndTime?: Time, nightmodeAutoLockEnabled?: boolean, nightmodeAutoUnlockDisabled?: boolean, nightmodeImmediateLockOnStart?: boolean) {
        super();
        this.totalDegrees = totalDegrees ?? 0;
        this.unlockedPositionOffsetDegrees = unlockedPositionOffsetDegrees ?? 0;
        this.lockedPositionOffsetDegrees = lockedPositionOffsetDegrees ?? 0;
        this.singleLockedPositionOffsetDegrees = singleLockedPositionOffsetDegrees ?? 0;
        this.unlockedToLockedTransitionOffsetDegrees = unlockedToLockedTransitionOffsetDegrees ?? 0;
        this.lockngoTimeout = lockngoTimeout;
        this.singleButtonPressAction = singleButtonPressAction;
        this.doubleButtonPressAction = doubleButtonPressAction;
        this.detachedCylinder = detachedCylinder;
        this.batteryType = batteryType;
        this.automaticBatteryTypeDetection = automaticBatteryTypeDetection;
        this.unlatchDuration = unlatchDuration;
        this.autoLockTimeout = autoLockTimeout;
        this.autoUnlockDisabled = autoUnlockDisabled;
        this.nightmodeEnabled = nightmodeEnabled;
        this.nightmodeStartTime = nightmodeStartTime;
        this.nightmodeEndTime = nightmodeEndTime;
        this.nightmodeAutoLockEnabled = nightmodeAutoLockEnabled;
        this.nightmodeAutoUnlockDisabled = nightmodeAutoUnlockDisabled;
        this.nightmodeImmediateLockOnStart = nightmodeImmediateLockOnStart;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 10 && buffer.length !== 16 && buffer.length !== 17 && buffer.length !== 19 && buffer.length !== 27 && buffer.length !== 28) {
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
        if (buffer.length > 10) {
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
            if (buffer.length > 16) {
                this.unlatchDuration = buffer.readUInt8(ofs);
                ofs += 1;
                if (buffer.length > 17) {
                    this.autoLockTimeout = buffer.readUInt16LE(ofs);
                    ofs += 2;
                    if (buffer.length > 19) {
                        this.autoUnlockDisabled = buffer.readUInt8(ofs) === 1;
                        ofs += 1;
                        this.nightmodeEnabled = buffer.readUInt8(ofs) === 1;
                        ofs += 1;
                        this.nightmodeStartTime = Time.decode(buffer, ofs);
                        ofs += 2;
                        this.nightmodeEndTime = Time.decode(buffer, ofs);
                        ofs += 2;
                        this.nightmodeAutoLockEnabled = buffer.readUInt8(ofs) === 1;
                        ofs += 1;
                        this.nightmodeAutoUnlockDisabled = buffer.readUInt8(ofs) === 1;
                        ofs += 1;
                        if (buffer.length > 27) {
                            this.nightmodeImmediateLockOnStart = buffer.readUInt8(ofs) === 1;
                        }
                    }
                }
            }
        }
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
        if (this.lockngoTimeout !== undefined) {
            buffer.writeUInt8(this.lockngoTimeout, ofs);
            ofs += 1;
            buffer.writeUInt8(this.singleButtonPressAction ?? 0, ofs);
            ofs += 1;
            buffer.writeUInt8(this.doubleButtonPressAction ?? 0, ofs);
            ofs += 1;
            buffer.writeUInt8(this.detachedCylinder ?? false ? 1 : 0, ofs);
            ofs += 1;
            buffer.writeUInt8(this.batteryType ?? 0, ofs);
            ofs += 1;
            buffer.writeUInt8(this.automaticBatteryTypeDetection ?? false ? 1 : 0, ofs);
            ofs += 1;
            if (this.unlatchDuration !== undefined) {
                buffer.writeUInt8(this.unlatchDuration ?? 0, ofs);
                ofs += 1;
                if (this.autoLockTimeout !== undefined) {
                    buffer.writeUInt16LE(this.autoLockTimeout ?? 0, ofs);
                    ofs += 2;
                    if (this.autoUnlockDisabled !== undefined) {
                        buffer.writeUInt8(this.autoUnlockDisabled ?? false ? 1 : 0, ofs);
                        ofs += 1;
                        buffer.writeUInt8(this.nightmodeEnabled ?? false ? 1 : 0, ofs);
                        ofs += 1;
                        (this.nightmodeStartTime ?? new Time(0, 0)).encode(buffer, ofs);
                        ofs += 2;
                        (this.nightmodeEndTime ?? new Time(0, 0)).encode(buffer, ofs);
                        ofs += 2;
                        buffer.writeUInt8(this.nightmodeAutoLockEnabled ?? false ? 1 : 0, ofs);
                        ofs += 1;
                        buffer.writeUInt8(this.nightmodeAutoUnlockDisabled ?? false ? 1 : 0, ofs);
                        ofs += 1;
                        if (this.nightmodeImmediateLockOnStart !== undefined) {
                            buffer.writeUInt8(this.nightmodeImmediateLockOnStart ?? false ? 1 : 0, ofs);
                            ofs += 1;
                        }
                    }
                }
            }
        }
        return buffer.slice(0, ofs);
    }
    
    toString(): string {
        let str = "AdvancedConfigCommand {";
        str += "\n  totalDegrees: " + "0x" + this.totalDegrees.toString(16).padStart(4, "0");
        str += "\n  unlockedPositionOffsetDegrees: " + "0x" + this.unlockedPositionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  lockedPositionOffsetDegrees: " + "0x" + this.lockedPositionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  singleLockedPositionOffsetDegrees: " + "0x" + this.singleLockedPositionOffsetDegrees.toString(16).padStart(4, "0");
        str += "\n  unlockedToLockedTransitionOffsetDegrees: " + "0x" + this.unlockedToLockedTransitionOffsetDegrees.toString(16).padStart(4, "0");
        if (this.lockngoTimeout !== undefined) {
            str += "\n  lockngoTimeout: " + "0x" + this.lockngoTimeout.toString(16).padStart(2, "0");
            str += "\n  singleButtonPressAction: " + "0x" + (this.singleButtonPressAction ?? 0).toString(16).padStart(2, "0");
            str += "\n  doubleButtonPressAction: " + "0x" + (this.doubleButtonPressAction ?? 0).toString(16).padStart(2, "0");
            str += "\n  detachedCylinder: " + this.detachedCylinder ?? false;
            str += "\n  batteryType: " + "0x" + (this.batteryType ?? 0).toString(16).padStart(2, "0");
            str += "\n  automaticBatteryTypeDetection: " + this.automaticBatteryTypeDetection ?? false;
            if (this.unlatchDuration !== undefined) {
                str += "\n  unlatchDuration: " + "0x" + (this.unlatchDuration ?? 0).toString(16).padStart(2, "0");
                if (this.autoLockTimeout !== undefined) {
                    str += "\n  autoLockTimeout: " + "0x" + (this.autoLockTimeout ?? 0).toString(16).padStart(4, "0");
                    if (this.autoUnlockDisabled !== undefined) {
                        str += "\n  autoUnlockDisabled: " + this.autoUnlockDisabled ?? false;
                        str += "\n  nightmodeEnabled: " + this.nightmodeEnabled ?? false;
                        str += "\n  nightmodeStartTime: " + (this.nightmodeStartTime ?? new Time(0, 0)).toString();
                        str += "\n  nightmodeEndTime: " + (this.nightmodeEndTime ?? new Time(0, 0)).toString();
                        str += "\n  nightmodeAutoLockEnabled: " + this.nightmodeAutoLockEnabled ?? false;
                        str += "\n  nightmodeAutoUnlockDisabled: " + this.nightmodeAutoUnlockDisabled ?? false;
                        if (this.nightmodeImmediateLockOnStart !== undefined) {
                            str += "\n  nightmodeImmediateLockOnStart: " + this.nightmodeImmediateLockOnStart ?? false;
                        }
                    }
                }
            }
        }
        str += "\n}";
        return str;
    }
    
}
