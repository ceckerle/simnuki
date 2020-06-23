import {DataIoCharacteristic} from "./DataIoCharacteristic";
import {KEYTURNER_GDIO_CHARACTERISTIC_UUID} from "./Protocol";
import {ERROR_UNKNOWN} from "./command/Constants";

export class KeyturnerGeneralCharacteristic extends DataIoCharacteristic {

    constructor() {
        super(KEYTURNER_GDIO_CHARACTERISTIC_UUID);
    }

    protected async handleRequest(data: Buffer): Promise<Buffer> {
        // TODO: implement
        return this.buildError(ERROR_UNKNOWN, 0, `Unexpected command on keyturner general characteristic ${data.toString("hex")}`);
    }

}
