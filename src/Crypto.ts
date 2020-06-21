import * as nacl from "tweetnacl";
import {randomBytes, createHmac} from "crypto";

export function random(len: number): Buffer {
    return randomBytes(len);
}

export function generateKeyPair(): {privateKey: Buffer, publicKey: Buffer} {
    const privateKey = random(32);
    const publicKey = new Buffer(nacl.scalarMult.base(privateKey));
    return {
        privateKey,
        publicKey
    };
}

export function deriveSharedSecret(privateKey: Buffer, publicKey: Buffer): Buffer {
    const k = new Buffer(nacl.scalarMult(privateKey, publicKey));
    const _0 = Buffer.alloc(16);
    const sigma = new Buffer("expand 32-byte k");
    const sharedKey = Buffer.alloc(32);
    (nacl as NaclLowLevel).lowlevel.crypto_core_hsalsa20(sharedKey, _0, k, sigma);
    return sharedKey;
}

export function encrypt(data: Buffer, nonce: Buffer, key: Buffer): Buffer {
    return new Buffer(nacl.secretbox(data, nonce,  key));
}

export function decrypt(data: Buffer, nonce: Buffer, key: Buffer): Buffer {
    return new Buffer(nacl.secretbox.open(data, nonce, key) as Uint8Array);
}

export function computeAuthenticator(key: Buffer, ...data: Buffer[]): Buffer {
    const hmac = createHmac("SHA256", key);
    for (const d of data) {
        hmac.update(d);
    }
    return hmac.digest();
}

interface NaclLowLevel extends nacl {
    lowlevel: {
        crypto_core_hsalsa20: (out: Buffer, inp: Buffer, k: Buffer, c: Buffer) => void;
    }
}
