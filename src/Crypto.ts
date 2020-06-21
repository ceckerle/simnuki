import * as sodium from "sodium";
import {createHmac} from "crypto";
import {HSalsa20} from "./HSalsa20";

export function random(len: number): Buffer {
    const buffer = Buffer.alloc(len);
    sodium.api.randombytes_buf(buffer);
    return buffer;
}

export function generateKeyPair(): {privateKey: Buffer, publicKey: Buffer} {
    const key = new sodium.Key.ECDH();
    return {
        privateKey: key.sk().get(),
        publicKey: key.pk().get()
    };
}

export function deriveSharedSecret(privateKey: Buffer, publicKey: Buffer): Buffer {
    const k = sodium.api.crypto_scalarmult(privateKey, publicKey);
    const hsalsa20 = new HSalsa20();
    const sharedSecret = Buffer.alloc(32);
    const inv = Buffer.alloc(16);
    const c = new Buffer("expand 32-byte k");
    hsalsa20.crypto_core(sharedSecret, inv, k, c);
    return sharedSecret;
}

export function encrypt(data: Buffer, nonce: Buffer, key: Buffer): Buffer {
    return sodium.api.crypto_secretbox(data, nonce, key).slice(16);
}

export function decrypt(data: Buffer, nonce: Buffer, key: Buffer): Buffer {
    return sodium.api.crypto_secretbox_open(data, nonce, key);
}

export function computeAuthenticator(key: Buffer, ...data: Buffer[]): Buffer {
    const hmac = createHmac("SHA256", key);
    for (const d of data) {
        hmac.update(d);
    }
    return hmac.digest();
}
