import {Command} from "./Command";
import {CMD_SET_CONFIG, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";

export class SetConfigCommand extends Command {
    
    readonly id = CMD_SET_CONFIG;
    name: string;
    latitude: number;
    longitude: number;
    autoUnlatch: number;
    pairingEnabled: number;
    buttonEnabled: number;
    ledEnabled: number;
    ledBrightness: number;
    timezoneOffset: number;
    dstMode: number;
    fobAction1: number;
    fobAction2: number;
    fobAction3: number;
    singleLock: number;
    advertisingMode: number;
    timezoneId: number;
    nonce: Buffer;
    securityPin: number;

    constructor(name?: string, latitude?: number, longitude?: number, autoUnlatch?: number, pairingEnabled?: number, buttonEnabled?: number, ledEnabled?: number, ledBrightness?: number, timezoneOffset?: number, dstMode?: number, fobAction1?: number, fobAction2?: number, fobAction3?: number, singleLock?: number, advertisingMode?: number, timezoneId?: number, nonce?: Buffer, securityPin?: number) {
        super();
        this.name = name ?? "";
        this.latitude = latitude ?? 0;
        this.longitude = longitude ?? 0;
        this.autoUnlatch = autoUnlatch ?? 0;
        this.pairingEnabled = pairingEnabled ?? 0;
        this.buttonEnabled = buttonEnabled ?? 0;
        this.ledEnabled = ledEnabled ?? 0;
        this.ledBrightness = ledBrightness ?? 0;
        this.timezoneOffset = timezoneOffset ?? 0;
        this.dstMode = dstMode ?? 0;
        this.fobAction1 = fobAction1 ?? 0;
        this.fobAction2 = fobAction2 ?? 0;
        this.fobAction3 = fobAction3 ?? 0;
        this.singleLock = singleLock ?? 0;
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
        this.timezoneOffset = buffer.readInt16LE(ofs);
        ofs += 2;
        this.dstMode = buffer.readUInt8(ofs);
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
        buffer.writeInt16LE(this.timezoneOffset, ofs);
        ofs += 2;
        buffer.writeUInt8(this.dstMode, ofs);
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
        // TODO: iOS app does not like this
        // buffer.writeUInt16LE(this.timezoneId, ofs);
        // ofs += 2;
        this.nonce.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt16LE(this.securityPin, ofs);
        return buffer;
    }
    
}
