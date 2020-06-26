import * as bleno from "@abandonware/bleno"
import {PAIRING_GDIO_CHARACTERISTIC_UUID, PAIRING_SERVICE_UUID} from "./Protocol";
import {DataIoCharacteristic, DataIoCharacteristicHandler} from "./DataIoCharacteristic";

export class PairingService extends bleno.PrimaryService {

    constructor(handler: DataIoCharacteristicHandler) {
        super({
            uuid: PAIRING_SERVICE_UUID,
            characteristics: [
                new DataIoCharacteristic(PAIRING_GDIO_CHARACTERISTIC_UUID, handler)
            ]
        });
    }

}
