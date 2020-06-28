import {
    KEYTURNER_GDIO_CHARACTERISTIC,
    KEYTURNER_GDIO_CHARACTERISTIC_UUID,
    KEYTURNER_SERVICE_UUID, KEYTURNER_THRID_CHARACTERISTIC,
    KEYTURNER_THRID_CHARACTERISTIC_UUID, KEYTURNER_USDIO_CHARACTERISTIC, KEYTURNER_USDIO_CHARACTERISTIC_UUID
} from "./Protocol";
import {DataIoService, DataIoServiceHandler} from "./DataIoService";

export class KeyturnerService extends DataIoService {

    constructor(handler: DataIoServiceHandler) {
        super(KEYTURNER_SERVICE_UUID, [{
            uuid: KEYTURNER_GDIO_CHARACTERISTIC_UUID,
            id: KEYTURNER_GDIO_CHARACTERISTIC
        }, {
            uuid: KEYTURNER_USDIO_CHARACTERISTIC_UUID,
            id: KEYTURNER_USDIO_CHARACTERISTIC
        }, {
            uuid: KEYTURNER_THRID_CHARACTERISTIC_UUID,
            id: KEYTURNER_THRID_CHARACTERISTIC,
            writeOnly: true
        }], handler);
    }

}
