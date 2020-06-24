import {Command} from "./Command";
import {CMD_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString, readDateTime, writeDateTime, readUInt24BE, writeUInt24BE} from "./Util";

export class ConfigCommand extends Command {
    
    readonly id = CMD_CONFIG;
    nukiId: number;
    name: string;
    latitude: number;
    longitude: number;
    autoUnlatch: number;
    pairingEnabled: number;
    buttonEnabled: number;
    ledEnabled: number;
    ledBrightness: number;
    currentTime: Date;
    timezoneOffset: number;
    dstMode: number;
    hasFob: number;
    fobAction1: number;
    fobAction2: number;
    fobAction3: number;
    singleLock: number;
    advertisingMode: number;
    hasKeypad: number;
    firmwareVersion: number;
    hardwareRevision: number;
    homekitStatus: number;
    timezoneId: number;

    constructor(nukiId?: number, name?: string, latitude?: number, longitude?: number, autoUnlatch?: number, pairingEnabled?: number, buttonEnabled?: number, ledEnabled?: number, ledBrightness?: number, currentTime?: Date, timezoneOffset?: number, dstMode?: number, hasFob?: number, fobAction1?: number, fobAction2?: number, fobAction3?: number, singleLock?: number, advertisingMode?: number, hasKeypad?: number, firmwareVersion?: number, hardwareRevision?: number, homekitStatus?: number, timezoneId?: number) {
        super();
        this.nukiId = nukiId ?? 0;
        this.name = name ?? "";
        this.latitude = latitude ?? 0;
        this.longitude = longitude ?? 0;
        this.autoUnlatch = autoUnlatch ?? 0;
        this.pairingEnabled = pairingEnabled ?? 0;
        this.buttonEnabled = buttonEnabled ?? 0;
        this.ledEnabled = ledEnabled ?? 0;
        this.ledBrightness = ledBrightness ?? 0;
        this.currentTime = currentTime ?? new Date();
        this.timezoneOffset = timezoneOffset ?? 0;
        this.dstMode = dstMode ?? 0;
        this.hasFob = hasFob ?? 0;
        this.fobAction1 = fobAction1 ?? 0;
        this.fobAction2 = fobAction2 ?? 0;
        this.fobAction3 = fobAction3 ?? 0;
        this.singleLock = singleLock ?? 0;
        this.advertisingMode = advertisingMode ?? 0;
        this.hasKeypad = hasKeypad ?? 0;
        this.firmwareVersion = firmwareVersion ?? 0;
        this.hardwareRevision = hardwareRevision ?? 0;
        this.homekitStatus = homekitStatus ?? 0;
        this.timezoneId = timezoneId ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 72) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.nukiId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.name = readString(buffer, ofs, 32);
        ofs += 32;
        this.latitude = buffer.readFloatLE(ofs);
        ofs += 4;
        this.longitude = buffer.readFloatLE(ofs);
        ofs += 4;
        this.autoUnlatch = buffer.readUInt8(ofs);
        ofs += 1;
        this.pairingEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.buttonEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.ledEnabled = buffer.readUInt8(ofs);
        ofs += 1;
        this.ledBrightness = buffer.readUInt8(ofs);
        ofs += 1;
        this.currentTime = readDateTime(buffer, ofs);
        ofs += 7;
        this.timezoneOffset = buffer.readInt16LE(ofs);
        ofs += 2;
        this.dstMode = buffer.readUInt8(ofs);
        ofs += 1;
        this.hasFob = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction1 = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction2 = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction3 = buffer.readUInt8(ofs);
        ofs += 1;
        this.singleLock = buffer.readUInt8(ofs);
        ofs += 1;
        this.advertisingMode = buffer.readUInt8(ofs);
        ofs += 1;
        this.hasKeypad = buffer.readUInt8(ofs);
        ofs += 1;
        this.firmwareVersion = readUInt24BE(buffer, ofs);
        ofs += 3;
        this.hardwareRevision = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.homekitStatus = buffer.readUInt8(ofs);
        // TODO: iOS app does not like this
        // ofs += 1;
        // this.timezoneId = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(72);
        let ofs = 0;
        buffer.writeUInt32LE(this.nukiId, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeFloatLE(this.latitude, ofs);
        ofs += 4;
        buffer.writeFloatLE(this.longitude, ofs);
        ofs += 4;
        buffer.writeUInt8(this.autoUnlatch, ofs);
        ofs += 1;
        buffer.writeUInt8(this.pairingEnabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.buttonEnabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.ledEnabled, ofs);
        ofs += 1;
        buffer.writeUInt8(this.ledBrightness, ofs);
        ofs += 1;
        writeDateTime(buffer, this.currentTime, ofs);
        ofs += 7;
        buffer.writeInt16LE(this.timezoneOffset, ofs);
        ofs += 2;
        buffer.writeUInt8(this.dstMode, ofs);
        ofs += 1;
        buffer.writeUInt8(this.hasFob, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction1, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction2, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction3, ofs);
        ofs += 1;
        buffer.writeUInt8(this.singleLock, ofs);
        ofs += 1;
        buffer.writeUInt8(this.advertisingMode, ofs);
        ofs += 1;
        buffer.writeUInt8(this.hasKeypad, ofs);
        ofs += 1;
        writeUInt24BE(buffer, this.firmwareVersion, ofs);
        ofs += 3;
        buffer.writeUInt16LE(this.hardwareRevision, ofs);
        ofs += 2;
        buffer.writeUInt8(this.homekitStatus, ofs);
        // TODO: iOS app does not like this
        // ofs += 1;
        // buffer.writeUInt16LE(this.timezoneId, ofs);
        return buffer;
    }
    
}
