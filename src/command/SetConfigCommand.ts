import {CommandNeedsSecurityPin} from "./CommandNeedsSecurityPin";
import {CMD_SET_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";

export class SetConfigCommand extends CommandNeedsSecurityPin {
    
    readonly id = CMD_SET_CONFIG;
    name: string;
    latitude: number;
    longitude: number;
    autoUnlatch: boolean;
    pairingEnabled: boolean;
    buttonEnabled: boolean;
    ledEnabled: boolean;
    ledBrightness: number;
    timezoneOffset: number;
    dstMode: boolean;
    fobAction1: number;
    fobAction2: number;
    fobAction3: number;
    singleLock: boolean;
    advertisingMode: number;
    timezoneId: number;
    nonce: Buffer;
    securityPin: number;

    constructor(name?: string, latitude?: number, longitude?: number, autoUnlatch?: boolean, pairingEnabled?: boolean, buttonEnabled?: boolean, ledEnabled?: boolean, ledBrightness?: number, timezoneOffset?: number, dstMode?: boolean, fobAction1?: number, fobAction2?: number, fobAction3?: number, singleLock?: boolean, advertisingMode?: number, timezoneId?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.name = name ?? "";
        this.latitude = latitude ?? 0;
        this.longitude = longitude ?? 0;
        this.autoUnlatch = autoUnlatch ?? false;
        this.pairingEnabled = pairingEnabled ?? false;
        this.buttonEnabled = buttonEnabled ?? false;
        this.ledEnabled = ledEnabled ?? false;
        this.ledBrightness = ledBrightness ?? 0;
        this.timezoneOffset = timezoneOffset ?? 0;
        this.dstMode = dstMode ?? false;
        this.fobAction1 = fobAction1 ?? 0;
        this.fobAction2 = fobAction2 ?? 0;
        this.fobAction3 = fobAction3 ?? 0;
        this.singleLock = singleLock ?? false;
        this.advertisingMode = advertisingMode ?? 0;
        this.timezoneId = timezoneId ?? 0;
        this.nonce = nonce ?? Buffer.alloc(32);
        this.securityPin = securityPin ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 87) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
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
        this.timezoneOffset = buffer.readInt16LE(ofs);
        ofs += 2;
        this.dstMode = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.fobAction1 = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction2 = buffer.readUInt8(ofs);
        ofs += 1;
        this.fobAction3 = buffer.readUInt8(ofs);
        ofs += 1;
        this.singleLock = buffer.readUInt8(ofs) === 1;
        ofs += 1;
        this.advertisingMode = buffer.readUInt8(ofs);
        ofs += 1;
        // TODO: iOS app does not like this
        // this.timezoneId = buffer.readUInt16LE(ofs);
        // ofs += 2;
        this.nonce = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.securityPin = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(87);
        let ofs = 0;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        buffer.writeFloatLE(this.latitude, ofs);
        ofs += 4;
        buffer.writeFloatLE(this.longitude, ofs);
        ofs += 4;
        buffer.writeUInt8(this.autoUnlatch === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.pairingEnabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.buttonEnabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.ledEnabled === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.ledBrightness, ofs);
        ofs += 1;
        buffer.writeInt16LE(this.timezoneOffset, ofs);
        ofs += 2;
        buffer.writeUInt8(this.dstMode === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction1, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction2, ofs);
        ofs += 1;
        buffer.writeUInt8(this.fobAction3, ofs);
        ofs += 1;
        buffer.writeUInt8(this.singleLock === true ? 1 : 0, ofs);
        ofs += 1;
        buffer.writeUInt8(this.advertisingMode, ofs);
        ofs += 1;
        // TODO: iOS app does not like this
        // buffer.writeUInt16LE(this.timezoneId, ofs);
        // ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "SetConfigCommand {";
        str += "\n  name: " + this.name;
        str += "\n  latitude: " + this.latitude;
        str += "\n  longitude: " + this.longitude;
        str += "\n  autoUnlatch: " + this.autoUnlatch;
        str += "\n  pairingEnabled: " + this.pairingEnabled;
        str += "\n  buttonEnabled: " + this.buttonEnabled;
        str += "\n  ledEnabled: " + this.ledEnabled;
        str += "\n  ledBrightness: " + "0x" + this.ledBrightness.toString(16).padStart(2, "0");
        str += "\n  timezoneOffset: " + "0x" + this.timezoneOffset.toString(16).padStart(4, "0");
        str += "\n  dstMode: " + this.dstMode;
        str += "\n  fobAction1: " + "0x" + this.fobAction1.toString(16).padStart(2, "0");
        str += "\n  fobAction2: " + "0x" + this.fobAction2.toString(16).padStart(2, "0");
        str += "\n  fobAction3: " + "0x" + this.fobAction3.toString(16).padStart(2, "0");
        str += "\n  singleLock: " + this.singleLock;
        str += "\n  advertisingMode: " + "0x" + this.advertisingMode.toString(16).padStart(2, "0");
        str += "\n  timezoneId: " + "0x" + this.timezoneId.toString(16).padStart(4, "0");
        str += "\n  nonce: " + "0x" + this.nonce.toString("hex");
        str += "\n  securityPin: " + "0x" + this.securityPin.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
