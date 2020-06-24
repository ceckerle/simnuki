import {Command} from "./Command";
import {CMD_SET_ADVANCED_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class SetAdvancedConfigCommand extends Command {
    
    readonly id = CMD_SET_ADVANCED_CONFIG;
    unlockedPositionOffsetDegrees: number;
    lockedPositionOffsetDegrees: number;
    singleLockedPositionOffsetDegrees: number;
    unlockedToLockedTransitionOffsetDegrees: number;
    lockngoTimeout: number;
    singleButtonPressAction: number;
    doubleButtonPressAction: number;
    detachedCylinder: number;
    batteryType: number;
    automaticBatteryTypeDetection: number;
    unlatchDuration: number;
    autoLockTimeout: number;
    autoUnlockDisabled: number;
    nightmodeEnabled: number;
    nightmodeStartTime: number;
    nightmodeEndTime: number;
    nightmodeAutoLockEnabled: number;
    nightmodeAutoUnlockDisabled: number;
    nightmodeImmediateLockOnStart: number;
    nonce: Buffer;
    securityPin: number;

    constructor(unlockedPositionOffsetDegrees?: number, lockedPositionOffsetDegrees?: number, singleLockedPositionOffsetDegrees?: number, unlockedToLockedTransitionOffsetDegrees?: number, lockngoTimeout?: number, singleButtonPressAction?: number, doubleButtonPressAction?: number, detachedCylinder?: number, batteryType?: number, automaticBatteryTypeDetection?: number, unlatchDuration?: number, autoLockTimeout?: number, autoUnlockDisabled?: number, nightmodeEnabled?: number, nightmodeStartTime?: number, nightmodeEndTime?: number, nightmodeAutoLockEnabled?: number, nightmodeAutoUnlockDisabled?: number, nightmodeImmediateLockOnStart?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.unlockedPositionOffsetDegrees = unlockedPositionOffsetDegrees ?? 0;
        this.lockedPositionOffsetDegrees = lockedPositionOffsetDegrees ?? 0;
        this.singleLockedPositionOffsetDegrees = singleLockedPositionOffsetDegrees ?? 0;
        this.unlockedToLockedTransitionOffsetDegrees = unlockedToLockedTransitionOffsetDegrees ?? 0;
        this.lockngoTimeout = lockngoTimeout ?? 0;
        this.singleButtonPressAction = singleButtonPressAction ?? 0;
        this.doubleButtonPressAction = doubleButtonPressAction ?? 0;
        this.detachedCylinder = detachedCylinder ?? 0;
        this.batteryType = batteryType ?? 0;
        this.automaticBatteryTypeDetection = automaticBatteryTypeDetection ?? 0;
        this.unlatchDuration = unlatchDuration ?? 0;
        this.autoLockTimeout = autoLockTimeout ?? 0;
        this.autoUnlockDisabled = autoUnlockDisabled ?? 0;
        this.nightmodeEnabled = nightmodeEnabled ?? 0;
        this.nightmodeStartTime = nightmodeStartTime ?? 0;
        this.nightmodeEndTime = nightmodeEndTime ?? 0;
        this.nightmodeAutoLockEnabled = nightmodeAutoLockEnabled ?? 0;
        this.nightmodeAutoUnlockDisabled = nightmodeAutoUnlockDisabled ?? 0;
        this.nightmodeImmediateLockOnStart = nightmodeImmediateLockOnStart ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 60) {
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
        this.lockngoTimeout = buffer.readUInt8(ofs);
        ofs += 1;
        this.singleButtonPressAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.doubleButtonPressAction = buffer.readUInt8(ofs);
        ofs += 1;
        this.detachedCylinder = buffer.readUInt8(ofs);
        ofs += 1;
        this.batteryType = buffer.readUInt8(ofs);
        ofs += 1;
        this.automaticBatteryTypeDetection = buffer.readUInt8(ofs);
        ofs += 1;
        this.unlatchDuration = buffer.readUInt8(ofs);
        ofs += 1;
        this.autoLockTimeout = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.autoUnlockDisabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.nightmodeEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.nightmodeStartTime = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nightmodeEndTime = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.nightmodeAutoLockEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.nightmodeAutoUnlockDisabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.nightmodeImmediateLockOnStart = buffer.readUInt8(ofs);
        ofs += 1;
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
        buffer.writeUInt8(this.lockngoTimeout, ofs);
        ofs += 1;
        buffer.writeUInt8(this.singleButtonPressAction, ofs);
        ofs += 1;
        buffer.writeUInt8(this.doubleButtonPressAction, ofs);
        ofs += 1;
        buffer.writeUInt8(this.detachedCylinder, ofs);
        ofs += 1;
        buffer.writeUInt8(this.batteryType, ofs);
        ofs += 1;
        buffer.writeUInt8(this.automaticBatteryTypeDetection, ofs);
        ofs += 1;
        buffer.writeUInt8(this.unlatchDuration, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.autoLockTimeout, ofs);
        ofs += 2;
        buffer.writeUInt8(this.autoUnlockDisabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.nightmodeEnabled, ofs);
        ofs += 1;
        buffer.writeUInt16LE(this.nightmodeStartTime, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.nightmodeEndTime, ofs);
        ofs += 2;
        buffer.writeUInt8(this.nightmodeAutoLockEnabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.nightmodeAutoUnlockDisabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.nightmodeImmediateLockOnStart, ofs);
        ofs += 1;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
}
