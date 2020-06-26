import {Configuration, User} from "./Configuration";
import {mocked} from "ts-jest/utils";
import {PairingGeneralDataIoHandler} from "./PairingGeneralDataIoHandler";
import {computeAuthenticator, deriveSharedSecret, generateKeyPair, random} from "./Crypto";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {CMD_PUBLIC_KEY, STATUS_COMPLETE} from "./command/Constants";
import {PublicKeyCommand} from "./command/PublicKeyCommand";
import {NUKI_NONCEBYTES, NUKI_STATE_PAIRING_MODE} from "./Protocol";
import {Command} from "./command/Command";
import {ChallengeCommand} from "./command/ChallengeCommand";
import {AuthorizationAuthenticatorCommand} from "./command/AuthorizationAuthenticatorCommand";
import {AuthorizationDataCommand} from "./command/AuthorizationDataCommand";
import {AuthorizationIdCommand} from "./command/AuthorizationIdCommand";
import {AuthorizationIdConfirmationCommand} from "./command/AuthorizationIdConfirmationCommand";
import {StatusCommand} from "./command/StatusCommand";

jest.mock("./Configuration");

const config = new Configuration();
const mockedConfig = mocked(config, true);
const unwrappedHandler = new PairingGeneralDataIoHandler(config);
const handler = wrapHandleRequest(unwrappedHandler.handleRequest.bind(unwrappedHandler));

beforeEach(() => {
    jest.resetAllMocks();
    unwrappedHandler.reset();
});

test("pairing", async () => {
    mockedConfig.getNukiState.mockReturnValue(NUKI_STATE_PAIRING_MODE);
    const serverPublicKey = await handler(new RequestDataCommand(CMD_PUBLIC_KEY), PublicKeyCommand);

    const keyPair = generateKeyPair();
    const sharedKey = deriveSharedSecret(keyPair.privateKey, serverPublicKey.publicKey);

    const challenge = await handler(new PublicKeyCommand(keyPair.publicKey), ChallengeCommand);

    const authenticator = computeAuthenticator(sharedKey, keyPair.publicKey, serverPublicKey.publicKey, challenge.nonce);

    const challenge2 = await handler(new AuthorizationAuthenticatorCommand(authenticator), ChallengeCommand);

    const appType = 0;
    const appId = 12345;
    const name = "Test"
    const authorizationData = new AuthorizationDataCommand(undefined, appType, appId, name, random(NUKI_NONCEBYTES));
    authorizationData.authenticator = computeAuthenticator(sharedKey, authorizationData.getAuthenticatedData(), challenge2.nonce);

    let user: User | undefined;
    const uuid = random(16).toString("hex");
    const authId = 67890;
    mockedConfig.getUsersArray.mockReturnValueOnce([]);
    mockedConfig.getNextAuthorizationId.mockReturnValueOnce(authId);
    mockedConfig.addOrReplaceUser.mockImplementationOnce((u: User) => {
        user = u;
        return u.authorizationId;
    });
    mockedConfig.getUuid.mockReturnValueOnce(uuid);
    const authorizationId = await handler(authorizationData, AuthorizationIdCommand);
    expect(authorizationId.authorizationId).toBe(authId);
    expect(user).toBeDefined();
    expect(user?.appType).toBe(appType);
    expect(user?.appId).toBe(appId);
    expect(user?.name).toBe(name);
    expect(user?.authorizationId).toBe(authId);
    expect(user?.sharedSecret).toBe(sharedKey.toString("hex"));

    const authoriationIdConfirmation = new AuthorizationIdConfirmationCommand(undefined, authorizationId.authorizationId);
    authoriationIdConfirmation.authenticator = computeAuthenticator(sharedKey, authoriationIdConfirmation.getAuthenticatedData(), authorizationId.nonce);

    const status = await handler(authoriationIdConfirmation, StatusCommand);
    expect(status.status).toBe(STATUS_COMPLETE);
});

function wrapHandleRequest(handleRequest: (data: Buffer) => Promise<Buffer>)  {
    return async <T extends Command>(command: Command, clazz: new() => T): Promise<T> => {
        const result = decodeCommand(await handleRequest(encodeCommand(command)));
        expect(result).toBeInstanceOf(clazz);
        return result as T;
    };
}
