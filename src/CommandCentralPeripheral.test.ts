import {CommandHandler, CommandPeripheral} from "./CommandPeripheral";
import {CommandCentral} from "./CommandCentral";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {CMD_PUBLIC_KEY} from "./command/Constants";
import {PAIRING_GDIO_CHARACTERISTIC} from "./Protocol";
import {PublicKeyCommand} from "./command/PublicKeyCommand";

test("command central and peripheral",async () => {
    const central = createCentralPeripheralPair(async (request) => {
        expect(request.characteristicId).toBe(PAIRING_GDIO_CHARACTERISTIC);
        expect(request.command).toBeInstanceOf(RequestDataCommand);
        return new PublicKeyCommand();
    }, () => undefined);
    const result = await central.executeCommand(new RequestDataCommand(CMD_PUBLIC_KEY), PAIRING_GDIO_CHARACTERISTIC, PublicKeyCommand);
    expect(result).toBeInstanceOf(PublicKeyCommand);
});

export function createCentralPeripheralPair(commandHandler: CommandHandler, sharedSecretProvider: (authId: number) => Buffer|undefined): CommandCentral {
    const peripheral = new CommandPeripheral([commandHandler], sharedSecretProvider);
    const central = new CommandCentral(async (data,characteristicId, receive) => {
        let done = false;
        await peripheral.handleDataIo(data, characteristicId, async (data: Buffer, characteristicId) => {
            if (done) {
                throw new Error("Received data from peripheral while central did not expect more");
            }
            if (await receive(data, characteristicId)) {
                done = true;
            }
        }, () => {
            throw new Error("Disconnect from peripheral");
        });
        if (!done) {
            throw new Error("Peripheral has finished the command while central is still waiting for more data");
        }
    });
    return central;
}
