import * as bleno from "@abandonware/bleno";
import {
    KEYTURNER_GDIO_CHARACTERISTIC_UUID,
    KEYTURNER_SERVICE_UUID,
    KEYTURNER_THRID_CHARACTERISTIC_UUID, KEYTURNER_USDIO_CHARACTERISTIC_UUID
} from "./Protocol";
import {DataIoCharacteristic, DataIoCharacteristicHandler} from "./DataIoCharacteristic";

export class KeyturnerService extends bleno.PrimaryService {

    constructor(gdioHandler: DataIoCharacteristicHandler, usdioHandler: DataIoCharacteristicHandler) {
        super({
            uuid: KEYTURNER_SERVICE_UUID,
            characteristics: [
                new DataIoCharacteristic(KEYTURNER_GDIO_CHARACTERISTIC_UUID, gdioHandler),
                new DataIoCharacteristic(KEYTURNER_USDIO_CHARACTERISTIC_UUID, usdioHandler),
                new bleno.Characteristic({
                    uuid: KEYTURNER_THRID_CHARACTERISTIC_UUID,
                    properties: ["write"]
                })
            ]
        });
    }

}
