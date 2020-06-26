import {Configuration} from "./Configuration";
import {mocked} from "ts-jest/utils";
import {random} from "./Crypto";
import {Command} from "./command/Command";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {decryptCommand, encryptCommand, KeyturnerUserSpecificDataIoHandler} from "./KeyturnerUserSpecificDataIoHandler";
import {KeyturnerStatesCommand} from "./command/KeyturnerStatesCommand";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {CMD_CHALLENGE, CMD_FIRMWARE_STATUS, CMD_KEYTURNER_STATES} from "./command/Constants";
import {FIRMWARE_VERSION, LOCK_STATE_LOCKED, NUKI_STATE_DOOR_MODE} from "./Protocol";
import {FirmwareStatusCommand} from "./command/FirmwareStatusCommand";
import {RequestConfigCommand} from "./command/RequestConfigCommand";
import {ChallengeCommand} from "./command/ChallengeCommand";
import {ConfigCommand} from "./command/ConfigCommand";

jest.mock("./Configuration");

const config = new Configuration();
const mockedConfig = mocked(config, true);
const unwrappedHandler = new KeyturnerUserSpecificDataIoHandler(config);
const handler = wrapHandleRequest(unwrappedHandler.handleRequest.bind(unwrappedHandler));

const user = {
    authorizationId: 12345,
    name: "Test",
    appType: 0,
    appId: 67890,
    sharedSecret: random(32).toString("hex")
}

beforeEach(() => {
    jest.resetAllMocks();
    mockedConfig.getUser.mockImplementation((id) => {
        expect(id).toBe(user.authorizationId);
        return user;
    });
    unwrappedHandler.reset();
});

test("keyturner status",async () => {
    mockedConfig.getNukiState.mockReturnValue(NUKI_STATE_DOOR_MODE);
    mockedConfig.getLockState.mockReturnValue(LOCK_STATE_LOCKED);
    const result = await handler(new RequestDataCommand(CMD_KEYTURNER_STATES), KeyturnerStatesCommand);
    expect(result.nukState).toBe(NUKI_STATE_DOOR_MODE);
    expect(result.lockState).toBe(LOCK_STATE_LOCKED);
});

test("firmware status", async () => {
    const result = await handler(new RequestDataCommand(CMD_FIRMWARE_STATUS), FirmwareStatusCommand);
    expect(result.version).toBe(FIRMWARE_VERSION);
});

test("get config", async () => {
    mockedConfig.getNukiIdStr.mockReturnValueOnce("12345678");
    mockedConfig.getName.mockReturnValue("Test");
    const challenge = await handler(new RequestDataCommand(CMD_CHALLENGE), ChallengeCommand);
    const result = await handler(new RequestConfigCommand(challenge.nonce), ConfigCommand);
    expect(result.nukiId).toBe(0x12345678);
    expect(result.name).toBe("Test");
});

function wrapHandleRequest(handleRequest: (data: Buffer, sendAsync: (data: Buffer) => Promise<void>) => Promise<Buffer>)  {
    return async <T extends Command>(command: Command, clazz: new() => T): Promise<T> => {
        const nonce = random(24);
        const encrypted = encryptCommand(encodeCommand(command), user.authorizationId, nonce, new Buffer(user.sharedSecret, "hex"));
        const result = await handleRequest(encrypted, async () => undefined);
        const decrypted = decryptCommand(result, (id) => {
            expect(id).toBe(user.authorizationId);
            return new Buffer(user.sharedSecret, "hex");
        });
        const resultCommand = decodeCommand(decrypted.data, true);
        expect(resultCommand).toBeInstanceOf(clazz);
        return resultCommand as T;
    };
}
