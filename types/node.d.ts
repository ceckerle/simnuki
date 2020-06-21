import {BasePrivateKeyEncodingOptions, KeyFormat, KeyPairSyncResult} from "crypto";

declare module "crypto" {

    interface X25519KeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        publicKeyEncoding: {
            type: 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs8';
        };
    }

    export function generateKeyPairSync(type: 'x25519', options: X25519KeyPairOptions<'der', 'der'>): KeyPairSyncResult<Buffer, Buffer>;

    export function diffieHellman(options: {
        privateKey: KeyObject;
        publicKey: KeyObject;
    }): Buffer;

}