import {Configuration} from "./Configuration";
import {mocked} from "ts-jest/utils";
import {random} from "./Crypto";
import {Command} from "./command/Command";
import {decodeCommand, encodeCommand} from "./command/Codec";
import {decryptCommand, encryptCommand, KeyturnerServiceHandler} from "./KeyturnerServiceHandler";
import {KeyturnerStatesCommand} from "./command/KeyturnerStatesCommand";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {CMD_CHALLENGE, CMD_FIRMWARE_STATUS, CMD_KEYTURNER_STATES, K_ERROR_NOT_AUTHORIZED} from "./command/Constants";
import {
    FIRMWARE_VERSION,
    KEYTURNER_GDIO_CHARACTERISTIC,
    KEYTURNER_USDIO_CHARACTERISTIC,
    LOCK_STATE_LOCKED,
    NUKI_STATE_DOOR_MODE
} from "./Protocol";
import {FirmwareStatusCommand} from "./command/FirmwareStatusCommand";
import {RequestConfigCommand} from "./command/RequestConfigCommand";
import {ChallengeCommand} from "./command/ChallengeCommand";
import {ConfigCommand} from "./command/ConfigCommand";
import {DataIoServiceHandler} from "./DataIoService";
import {ErrorCommand} from "./command/ErrorCommand";
import {disconnect} from "cluster";

jest.mock("./Configuration");

const config = new Configuration();
const mockedConfig = mocked(config, true);
const unwrappedHandler = new KeyturnerServiceHandler(config);
const handler = wrapHandleRequest(unwrappedHandler.handleRequest.bind(unwrappedHandler));

const user = {
    authorizationId: 12345,
    name: "Test",
    appType: 0,
    appId: 67890,
    sharedSecret: random(32).toString("hex")
}

let clientUser = user;

beforeEach(() => {
    jest.resetAllMocks();
    mockedConfig.getUser.mockImplementation((id) => {
        expect(id).toBe(user.authorizationId);
        return user;
    });
    unwrappedHandler.reset();
    clientUser = user;
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

test("wrong authorization id", async () => {
    clientUser = {
        ...user,
        authorizationId: 42
    };
    const error = await handler(new RequestDataCommand(CMD_CHALLENGE), ErrorCommand);
    expect(error.errorCode).toBe(K_ERROR_NOT_AUTHORIZED);
});

test("wrong encryption key", async () => {
    clientUser = {
        ...user,
        sharedSecret: random(32).toString("hex")
    };
    const error = await handler(new RequestDataCommand(CMD_CHALLENGE), ErrorCommand);
    expect(error.errorCode).toBe(K_ERROR_NOT_AUTHORIZED);
});

function wrapHandleRequest(handleRequest: DataIoServiceHandler)  {
    return async <T extends Command>(command: Command, clazz: new() => T, characteristicId = KEYTURNER_USDIO_CHARACTERISTIC): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            let data = encodeCommand(command);
            if (characteristicId === KEYTURNER_USDIO_CHARACTERISTIC) {
                data = encryptCommand(data, clientUser.authorizationId, Buffer.from(clientUser.sharedSecret, "hex"));
            } else if (characteristicId !== KEYTURNER_GDIO_CHARACTERISTIC) {
                throw new Error(`Unexpected characteristic id ${characteristicId.toString(16)}`);
            }
            handleRequest(data, characteristicId, async (data, characteristicId) => {
                try {
                    let resultCommand: Command;
                    if (characteristicId === KEYTURNER_USDIO_CHARACTERISTIC) {
                        const decrypted = decryptCommand(data, (id) => {
                            expect(id).toBe(clientUser.authorizationId);
                            return Buffer.from(clientUser.sharedSecret, "hex");
                        });
                        resultCommand = decodeCommand(decrypted.data, true);
                    } else if (characteristicId === KEYTURNER_GDIO_CHARACTERISTIC) {
                        resultCommand = decodeCommand(data);
                    } else {
                        throw new Error(`Unexpected characteristic id ${characteristicId.toString(16)}`);
                    }
                    expect(resultCommand).toBeInstanceOf(clazz);
                    resolve(resultCommand as T);
                } catch (e) {
                    reject(e);
                }
            }, () => undefined).catch(reject);
        });
    };
}
