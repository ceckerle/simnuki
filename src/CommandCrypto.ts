import {DecodingError} from "./command/DecodingError";
import {ERROR_BAD_CRC, ERROR_BAD_LENGTH, ERROR_UNKNOWN, K_ERROR_INVALID_AUTH_ID} from "./command/Constants";
import {decrypt, encrypt, random} from "./Crypto";
import {checkCrc, setCrc} from "./command/Util";

export function decryptCommand(data: Buffer, sharedSecretProvider: (authId: number) => Buffer|undefined): {
    data: Buffer,
    authorizationId: number,
    sharedSecret: Buffer
} {
    if (data.length < 38) {
        throw new DecodingError(ERROR_BAD_LENGTH, 0, "bad length");
    }

    const nonce = data.slice(0, 24);
    const authorizationId = data.readUInt32LE(24);
    const commandLen = data.readUInt16LE(28);
    const encryptedCommand = data.slice(30);
    if (encryptedCommand.length !== commandLen) {
        throw new DecodingError(ERROR_BAD_LENGTH, 0, "bad encrypted command length");
    }

    const sharedSecret = sharedSecretProvider(authorizationId);
    if (!sharedSecret) {
        throw new DecodingError(K_ERROR_INVALID_AUTH_ID, 0, "bad user");
    }

    const decryptedCommand = decrypt(Buffer.concat([encryptedCommand]), nonce, sharedSecret);
    if (!decryptedCommand) {
        throw new DecodingError(ERROR_UNKNOWN, 0, "bad encryption");
    }

    if (!checkCrc(decryptedCommand)) {
        throw new DecodingError(ERROR_BAD_CRC, 0, "bad crc");
    }

    const authorizationIdFromEncryptedCommand = decryptedCommand.readUInt32LE(0);
    if (authorizationIdFromEncryptedCommand !== authorizationId) {
        throw new DecodingError(K_ERROR_INVALID_AUTH_ID, 0, "invalid encrypted command auth id");
    }

    return {
        data: decryptedCommand.slice(4),
        authorizationId,
        sharedSecret
    };
}

export function encryptCommand(data: Buffer, authId: number, sharedSecret: Buffer): Buffer {
    const authIdBuffer = Buffer.alloc(4);
    authIdBuffer.writeUInt32LE(authId, 0);
    const responseData = Buffer.concat([authIdBuffer, data]);
    setCrc(responseData);

    const nonce = random(24);

    const pDataEncrypted = encrypt(responseData, nonce, sharedSecret);

    const lenBuffer = Buffer.alloc(2);
    lenBuffer.writeUInt16LE(pDataEncrypted.length, 0);

    return Buffer.concat([nonce, authIdBuffer, lenBuffer, pDataEncrypted]);
}
