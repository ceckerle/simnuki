import {computeAuthenticator, decrypt, deriveSharedSecret, encrypt, generateKeyPair, random} from "./Crypto";

const serverPrivateKey = Buffer.from("e7b0ed4e3fd53beb1ace91475b4a9eabc4d7c47f19c84193ebddac953ff9bc45", "hex");
const serverPublicKey = Buffer.from("0d4105dbc4dd1e9ff474bd28ef9539b1b0b09fa5444c0d1adabc590f4b5e2e56", "hex");
const clientPrivateKey = Buffer.from("4122ac9fd03aed655010583c279507577981fa6738a90a16fb05a87475954ba4", "hex");
const clientPublicKey = Buffer.from("76541d1e8bddfa8bb545e5172734c35653761ccbddc5536ef5bf544bde99b427", "hex");
const sharedKey = Buffer.from("fadc14fc1cbb2813e0c5bc29b9411370a76b85e3983783aadfa1f11c5aa6aa25", "hex");
const plain = Buffer.from("1234567890abcdef", "hex");
const nonce = Buffer.from("8c34a5503c40cfae7184b296f58fbaa2f6f9d3ccff58f103", "hex");
const encrypted = Buffer.from("e0c19497e5e8dc6d1f444ffb1efebca6a977b136f5846e18", "hex");
const hmac = Buffer.from("7d5dac4faf9dae6a1e18d9a62e31137f187c920a389a828602d86ba234362285", "hex");

test("shared key derivation", () => {
    const serverKey = generateKeyPair();
    const clientKey = generateKeyPair();
    const serverSharedKey = deriveSharedSecret(serverKey.privateKey, clientKey.publicKey);
    const clientSharedKey = deriveSharedSecret(clientKey.privateKey, serverKey.publicKey);
    expect(serverSharedKey).toEqual(clientSharedKey);
});

test("shared key derivation with known values", () => {
    const serverSharedKey = deriveSharedSecret(serverPrivateKey, clientPublicKey);
    const clientSharedKey = deriveSharedSecret(clientPrivateKey, serverPublicKey);
    expect(serverSharedKey).toEqual(sharedKey);
    expect(clientSharedKey).toEqual(sharedKey);
});

test("encryption/decryption", () => {
    const sharedKey = random(32);
    const nonce = random(24);
    const plain = random(17);
    const enc = encrypt(plain, nonce, sharedKey);
    const dec = decrypt(enc, nonce, sharedKey);
    expect(dec).toEqual(plain);
});

test("encryption/decryption with known values", () => {
    const enc = encrypt(plain, nonce, sharedKey);
    expect(enc).toEqual(encrypted);
    const dec = decrypt(encrypted, nonce, sharedKey);
    expect(dec).toEqual(plain);
});

test("hmac with known values", () => {
    const h = computeAuthenticator(sharedKey, plain, nonce);
    expect(h).toEqual(hmac);
});
