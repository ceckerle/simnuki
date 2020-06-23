import {Command} from "./Command";
import {CMD_AUTHORIZATION_DATA, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {readString, writeString} from "./Util";

export class AuthorizationDataCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_DATA;
    authenticator: Buffer;
    appType: number;
    appId: number;
    name: string;
    nonce: Buffer;

    constructor(authenticator?: Buffer, appType?: number, appId?: number, name?: string, nonce?: Buffer) {
        super();
        this.authenticator = authenticator ?? Buffer.alloc(32);
        this.appType = appType ?? 0;
        this.appId = appId ?? 0;
        this.name = name ?? "";
        this.nonce = nonce ?? Buffer.alloc(32);
    }
    
    getAuthenticatedData(): Buffer {
        return this.encode().slice(32, 101); // appType, appId, name, nonce
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 101) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authenticator = buffer.slice(ofs, ofs + 32);
        ofs += 32;
        this.appType = buffer.readUInt8(ofs);
        ofs += 1;
        this.appId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.name = readString(buffer, ofs, 32);
        ofs += 32;
        this.nonce = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(101);
        let ofs = 0;
        this.authenticator.copy(buffer, ofs);
        ofs += 32;
        buffer.writeUInt8(this.appType, ofs);
        ofs += 1;
        buffer.writeUInt32LE(this.appId, ofs);
        ofs += 4;
        writeString(buffer, this.name, ofs, 32);
        ofs += 32;
        this.nonce.copy(buffer, ofs);
        return buffer;
    }
    
}
