import * as sodium from "sodium";
import {
    createHmac,
    createPrivateKey,
    createPublicKey,
    diffieHellman,
    generateKeyPairSync,
    randomFillSync
} from "crypto";

const PRIVATE_KEY_DER_HEADER = new Buffer("302e020100300506032b656e04220420", "hex"); // see RFC-8410, SubjectPublicKeyInfo
const PUBLIC_KEY_DER_HEADER = new Buffer("302a300506032b656e032100", "hex"); // see RFC-8410, OneAsymmetricKey
const KEY_LENGTH = 32;

export function random(len: number): Buffer {
    const buffer = Buffer.alloc(len);
    // sodium.api.randombytes_buf(buffer);
    randomFillSync(buffer);
    return buffer;
}

export function generateKeyPair(): {privateKey: Buffer, publicKey: Buffer} {
    // const privateKey = Buffer.alloc(32);
    // sodium.api.randombytes_buf(privateKey);
    // const publicKey = sodium.api.crypto_scalarmult_curve25519_base(privateKey);
    const keyPair = generateKeyPairSync("x25519", {
        privateKeyEncoding: {
            type: "pkcs8",
            format: "der"
        },
        publicKeyEncoding: {
            type: "spki",
            format: "der"
        }
    });
    if (keyPair.privateKey.length !== PRIVATE_KEY_DER_HEADER.length + KEY_LENGTH ||
        Buffer.compare(PRIVATE_KEY_DER_HEADER, keyPair.privateKey.slice(0, PRIVATE_KEY_DER_HEADER.length)) !== 0) {
        throw new Error("Unsupported private key format.");
    }
    if (keyPair.publicKey.length !== PUBLIC_KEY_DER_HEADER.length + KEY_LENGTH ||
        Buffer.compare(PUBLIC_KEY_DER_HEADER, keyPair.publicKey.slice(0, PUBLIC_KEY_DER_HEADER.length)) !== 0) {
        throw new Error("Unsupported private key format.");
    }
    const privateKey = keyPair.privateKey.slice(PRIVATE_KEY_DER_HEADER.length);
    const publicKey = keyPair.publicKey.slice(PUBLIC_KEY_DER_HEADER.length);
    return {
        privateKey,
        publicKey
    };
}

export function deriveSharedSecret(privateKey: Buffer, publicKey: Buffer): Buffer {
    // const k = sodium.api.crypto_scalarmult_curve25519(privateKey, publicKey);
    privateKey = Buffer.concat([PRIVATE_KEY_DER_HEADER, privateKey]);
    publicKey = Buffer.concat([PUBLIC_KEY_DER_HEADER, publicKey]);
    const privateKeyObject = createPrivateKey({
        key: privateKey,
        type: "pkcs8",
        format: "der"
    });
    const publicKeyObject = createPublicKey({
        key: publicKey,
        type: "spki",
        format: "der"
    });
    const k = diffieHellman({
        privateKey: privateKeyObject,
        publicKey: publicKeyObject
    });
    const _0 = Buffer.alloc(16);
    const sigma = new Buffer("expand 32-byte k");
    return sodium.api.crypto_core_hsalsa20(_0, k, sigma);
}

export function encrypt(data: Buffer, nonce: Buffer, key: Buffer): Buffer {
    return sodium.api.crypto_secretbox_xsalsa20poly1305(data, nonce, key).slice(16);
}

export function decrypt(data: Buffer, nonce: Buffer, key: Buffer): Buffer {
    return sodium.api.crypto_secretbox_xsalsa20poly1305_open(Buffer.concat([Buffer.alloc(16), data]), nonce, key);
}

export function computeAuthenticator(key: Buffer, ...data: Buffer[]): Buffer {
    const hmac = createHmac("SHA256", key);
    for (const d of data) {
        hmac.update(d);
    }
    return hmac.digest();
}
