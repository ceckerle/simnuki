declare module "sodium" {

    interface Sodium {
        api: {
            randombytes_buf: (b: Buffer) => void;
            crypto_scalarmult_curve25519_base: (a: Buffer) => Buffer;
            crypto_scalarmult_curve25519: (a: Buffer, b: Buffer) => Buffer;
            crypto_core_hsalsa20: (a: Buffer, b: Buffer, c: Buffer) => Buffer;
            crypto_secretbox_xsalsa20poly1305: (a: Buffer, b: Buffer, c: Buffer) => Buffer;
            crypto_secretbox_xsalsa20poly1305_open: (a: Buffer, b: Buffer, c: Buffer) => Buffer;
        }
    }

    const sodium: Sodium;
    export = sodium;

}