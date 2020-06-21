import {DataIoCharacteristic} from "./DataIoCharacteristic";
import {KEYTURNER_GDIO_CHARACTERISTIC_UUID} from "./Constants";

export class KeyturnerGeneralCharacteristic extends DataIoCharacteristic {

    constructor() {
        super(KEYTURNER_GDIO_CHARACTERISTIC_UUID);
    }

    protected async handleRequest(data: Buffer): Promise<Buffer> {
        // TODO: implement
        return Buffer.alloc(0);
    }

}
