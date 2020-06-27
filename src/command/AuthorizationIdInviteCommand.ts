import {Command} from "./Command";
import {CMD_AUTHORIZATION_ID_INVITE, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";
import {DateTime} from "./DateTime";

export class AuthorizationIdInviteCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_ID_INVITE;
    authorizationId: number;
    dateCreated: DateTime;

    constructor(authorizationId?: number, dateCreated?: DateTime) {
        super();
        this.authorizationId = authorizationId ?? 0;
        this.dateCreated = dateCreated ?? new DateTime(0, 0, 0, 0, 0, 0);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 11) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.authorizationId = buffer.readUInt32LE(ofs);
        ofs += 4;
        this.dateCreated = DateTime.decode(buffer, ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(11);
        let ofs = 0;
        buffer.writeUInt32LE(this.authorizationId, ofs);
        ofs += 4;
        this.dateCreated.encode(buffer, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "AuthorizationIdInviteCommand {";
        str += "\n  authorizationId: " + "0x" + this.authorizationId.toString(16).padStart(8, "0");
        str += "\n  dateCreated: " + this.dateCreated.toString();
        str += "\n}";
        return str;
    }
    
}
