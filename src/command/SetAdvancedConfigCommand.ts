import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_SET_ADVANCED_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {Time} from "./Time";

export class SetAdvancedConfigCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_SET_ADVANCED_CONFIG;
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
    nonce: Buffer;
    securityPin: number;

    constructor(unlockedPositionOffsetDegrees?: number, lockedPositionOffsetDegrees?: number, singleLockedPositionOffsetDegrees?: number, unlockedToLockedTransitionOffsetDegrees?: number, lockngoTimeout?: number, singleButtonPressAction?: number, doubleButtonPressAction?: number, detachedCylinder?: boolean, batteryType?: number, automaticBatteryTypeDetection?: boolean, unlatchDuration?: number, autoLockTimeout?: number, autoUnlockDisabled?: boolean, nightmodeEnabled?: boolean, nightmodeStartTime?: Time, nightmodeEndTime?: Time, nightmodeAutoLockEnabled?: boolean, nightmodeAutoUnlockDisabled?: boolean, nightmodeImmediateLockOnStart?: boolean, nonce?: Buffer, securityPin?: number) {
        super();
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
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 42 && buffer.length !== 60) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.unlockedPositionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.lockedPositionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.singleLockedPositionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        this.unlockedToLockedTransitionOffsetDegrees = buffer.readInt16LE(ofs);
        ofs += 2;
        if (buffer.length > 42) {
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
            this.nightmodeStartTime = Time.decode(buffer, ofs);
            ofs += 2;
            this.nightmodeEndTime = Time.decode(buffer, ofs);
            ofs += 2;
            this.nightmodeAutoLockEnabled = buffer.readUInt8(ofs) === 1;
            ofs += 1;
            this.nightmodeAutoUnlockDisabled = buffer.readUInt8(ofs) === 1;
            ofs += 1;
            this.nightmodeImmediateLockOnStart = buffer.readUInt8(ofs) === 1;
            ofs += 1;
        }
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(60);
        let ofs = 0;
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
            buffer.writeUInt8(this.unlatchDuration ?? 0, ofs);
            ofs += 1;
            buffer.writeUInt16LE(this.autoLockTimeout ?? 0, ofs);
            ofs += 2;
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
            buffer.writeUInt8(this.nightmodeImmediateLockOnStart ?? false ? 1 : 0, ofs);
            ofs += 1;
        }
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        ofs += 2;
        return buffer.slice(0, ofs);
    }
    
    toString(): string {
        let str = "SetAdvancedConfigCommand {";
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
            str += "\n  unlatchDuration: " + "0x" + (this.unlatchDuration ?? 0).toString(16).padStart(2, "0");
            str += "\n  autoLockTimeout: " + "0x" + (this.autoLockTimeout ?? 0).toString(16).padStart(4, "0");
            str += "\n  autoUnlockDisabled: " + this.autoUnlockDisabled ?? false;
            str += "\n  nightmodeEnabled: " + this.nightmodeEnabled ?? false;
            str += "\n  nightmodeStartTime: " + (this.nightmodeStartTime ?? new Time(0, 0)).toString();
            str += "\n  nightmodeEndTime: " + (this.nightmodeEndTime ?? new Time(0, 0)).toString();
            str += "\n  nightmodeAutoLockEnabled: " + this.nightmodeAutoLockEnabled ?? false;
            str += "\n  nightmodeAutoUnlockDisabled: " + this.nightmodeAutoUnlockDisabled ?? false;
            str += "\n  nightmodeImmediateLockOnStart: " + this.nightmodeImmediateLockOnStart ?? false;
        }
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
