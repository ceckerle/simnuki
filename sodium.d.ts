declare module "sodium" {

    class KeyPair {

    }

    class DHKey extends KeyPair {
        constructor(publicKey?: any, secretKey?: any, encoding?: string);

    }

    interface Sodium {
        Key: {
            ECDH: typeof DHKey
        }
        api: {
            crypto_scalarmult: (n: Buffer, p: Buffer) => Buffer;
            randombytes_buf: (b: Buffer) => void;
            crypto_secretbox_open: (a: Buffer, b: Buffer, c: Buffer) => Buffer;
            crypto_secretbox: (a: Buffer, b: Buffer, c: Buffer) => Buffer;
        }
    }

    const sodium: Sodium;
    export = sodium;

}