import {Command} from "./Command";
import {CMD_AUTHORIZATION_AUTHENTICATOR, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class AuthorizationAuthenticatorCommand extends Command {
    
    readonly id = CMD_AUTHORIZATION_AUTHENTICATOR;
    authenticator: Buffer;

    constructor(authenticator?: Buffer) {
        super();
        this.authenticator = authenticator ?? Buffer.alloc(32);
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 32) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        const ofs = 0;
        this.authenticator = buffer.slice(ofs, ofs + 32);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(32);
        const ofs = 0;
        this.authenticator.copy(buffer, ofs);
        return buffer;
    }
    
}
