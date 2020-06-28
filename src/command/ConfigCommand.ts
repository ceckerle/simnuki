import {Command} from "./Command";
import {CMD_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString, readUInt24BE, writeUInt24BE} from "./Util";
import {DateTime} from "./DateTime";

export class ConfigCommand extends Command {
    
    readonly id = CMD_CONFIG;
    nukiId: number;
    name: string;
    latitude: number;
    longitude: number;
    autoUnlatch: boolean;
    pairingEnabled: boolean;
    buttonEnabled: boolean;
    ledEnabled: boolean;
    ledBrightness: number;
    currentTime: DateTime;
    timezoneOffset: number;
    dstMode: boolean;
    hasFob: boolean;
    fobAction1: number;
    fobAction2: number;
    fobAction3: number;
    singleLock?: boolean;
    advertisingMode?: number;
    hasKeypad?: boolean;
    firmwareVersion?: number;
    hardwareRevision?: number;
    homekitStatus?: number;
    timezoneId?: number;

    constructor(nukiId?: number, name?: string, latitude?: number, longitude?: number, autoUnlatch?: boolean, pairingEnabled?: boolean, buttonEnabled?: boolean, ledEnabled?: boolean, ledBrightness?: number, currentTime?: DateTime, timezoneOffset?: number, dstMode?: boolean, hasFob?: boolean, fobAction1?: number, fobAction2?: number, fobAction3?: number, singleLock?: boolean, advertisingMode?: number, hasKeypad?: boolean, firmwareVersion?: number, hardwareRevision?: number, homekitStatus?: number, timezoneId?: number) {
        super();
        this.nukiId = nukiId ?? 0;
        this.name = name ?? "";
        this.latitude = latitude ?? 0;
        this.longitude = longitude ?? 0;
        this.autoUnlatch = autoUnlatch ?? false;
        this.pairingEnabled = pairingEnabled ?? false;
        this.buttonEnabled = buttonEnabled ?? false;
        this.ledEnabled = ledEnabled ?? false;
        this.ledBrightness = ledBrightness ?? 0;
        this.currentTime = currentTime ?? new DateTime(0, 0, 0, 0, 0, 0);
        this.timezoneOffset = timezoneOffset ?? 0;
        this.dstMode = dstMode ?? false;
        this.hasFob = hasFob ?? false;
        this.fobAction1 = fobAction1 ?? 0;
        this.fobAction2 = fobAction2 ?? 0;
        this.fobAction3 = fobAction3 ?? 0;
        this.singleLock = singleLock;
        this.advertisingMode = advertisingMode;
        this.hasKeypad = hasKeypad;
        this.firmwareVersion = firmwareVersion;
        this.hardwareRevision = hardwareRevision;
        this.homekitStatus = homekitStatus;
        this.timezoneId = timezoneId;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 63 && buffer.length !== 65 && buffer.length !== 72 && buffer.length !== 74) {
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
        this.autoUnlatch = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.pairingEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.buttonEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.ledEnabled = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.ledBrightness = buffer.readUInt8(ofs);
        ofs += 1;
        this.currentTime = DateTime.decode(buffer, ofs);
        ofs += 7;
        this.timezoneOffset = buffer.readInt16LE(ofs);
        ofs += 2;
        this.dstMode = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.hasFob = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.fobAction1 = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction2 = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction3 = buffer.readUInt8(ofs);
        ofs += 1;
        if (buffer.length > 63) {
            this.singleLock = buffer.readUInt8(ofs) === 1;
            ofs += 1;
            this.advertisingMode = buffer.readUInt8(ofs);
            ofs += 1;
            if (buffer.length > 65) {
                this.hasKeypad = buffer.readUInt8(ofs) === 1;
                ofs += 1;
                this.firmwareVersion = readUInt24BE(buffer, ofs);
                ofs += 3;
                this.hardwareRevision = buffer.readUInt16LE(ofs);
                ofs += 2;
                this.homekitStatus = buffer.readUInt8(ofs);
                ofs += 1;
                if (buffer.length > 72) {
                    this.timezoneId = buffer.readUInt16LE(ofs);
                }
            }
        }
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(74);
        let ofs = 0;
        buffer.writeUInt32LE(this.nukiId, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeFloatLE(this.latitude, ofs);
        ofs += 4;
        buffer.writeFloatLE(this.longitude, ofs);
        ofs += 4;
        buffer.writeUInt8(this.autoUnlatch ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.pairingEnabled ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.buttonEnabled ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.ledEnabled ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.ledBrightness, ofs);
        ofs += 1;
        this.currentTime.encode(buffer, ofs);
        ofs += 7;
        buffer.writeInt16LE(this.timezoneOffset, ofs);
        ofs += 2;
        buffer.writeUInt8(this.dstMode ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.hasFob ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction1, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction2, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction3, ofs);
        ofs += 1;
        if (this.singleLock !== undefined) {
            buffer.writeUInt8(this.singleLock ? 1 : 0, ofs);
            ofs += 1;
            buffer.writeUInt8(this.advertisingMode ?? 0, ofs);
            ofs += 1;
            if (this.hasKeypad !== undefined) {
                buffer.writeUInt8(this.hasKeypad ?? false ? 1 : 0, ofs);
                ofs += 1;
                writeUInt24BE(buffer, this.firmwareVersion ?? 0, ofs);
                ofs += 3;
                buffer.writeUInt16LE(this.hardwareRevision ?? 0, ofs);
                ofs += 2;
                buffer.writeUInt8(this.homekitStatus ?? 0, ofs);
                ofs += 1;
                if (this.timezoneId !== undefined) {
                    buffer.writeUInt16LE(this.timezoneId ?? 0, ofs);
                    ofs += 2;
                }
            }
        }
        return buffer.slice(0, ofs);
    }
    
    toString(): string {
        let str = "ConfigCommand {";
        str += "\n  nukiId: " + "0x" + this.nukiId.toString(16).padStart(8, "0");
        str += "\n  name: " + this.name;
        str += "\n  latitude: " + this.latitude;
        str += "\n  longitude: " + this.longitude;
        str += "\n  autoUnlatch: " + this.autoUnlatch;
        str += "\n  pairingEnabled: " + this.pairingEnabled;
        str += "\n  buttonEnabled: " + this.buttonEnabled;
        str += "\n  ledEnabled: " + this.ledEnabled;
        str += "\n  ledBrightness: " + "0x" + this.ledBrightness.toString(16).padStart(2, "0");
        str += "\n  currentTime: " + this.currentTime.toString();
        str += "\n  timezoneOffset: " + "0x" + this.timezoneOffset.toString(16).padStart(4, "0");
        str += "\n  dstMode: " + this.dstMode;
        str += "\n  hasFob: " + this.hasFob;
        str += "\n  fobAction1: " + "0x" + this.fobAction1.toString(16).padStart(2, "0");
        str += "\n  fobAction2: " + "0x" + this.fobAction2.toString(16).padStart(2, "0");
        str += "\n  fobAction3: " + "0x" + this.fobAction3.toString(16).padStart(2, "0");
        if (this.singleLock !== undefined) {
            str += "\n  singleLock: " + this.singleLock;
            str += "\n  advertisingMode: " + "0x" + (this.advertisingMode ?? 0).toString(16).padStart(2, "0");
            if (this.hasKeypad !== undefined) {
                str += "\n  hasKeypad: " + this.hasKeypad ?? false;
                str += "\n  firmwareVersion: " + "0x" + (this.firmwareVersion ?? 0).toString(16).padStart(6, "0");
                str += "\n  hardwareRevision: " + "0x" + (this.hardwareRevision ?? 0).toString(16).padStart(4, "0");
                str += "\n  homekitStatus: " + "0x" + (this.homekitStatus ?? 0).toString(16).padStart(2, "0");
                if (this.timezoneId !== undefined) {
                    str += "\n  timezoneId: " + "0x" + (this.timezoneId ?? 0).toString(16).padStart(4, "0");
                }
            }
        }
        str += "\n}";
        return str;
    }
    
}
