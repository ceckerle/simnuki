import {PAIRING_GDIO_CHARACTERISTIC, PAIRING_GDIO_CHARACTERISTIC_UUID, PAIRING_SERVICE_UUID} from "./Protocol";
import {DataIoService, DataIoServiceHandler} from "./DataIoService";

export class PairingService extends DataIoService {

    constructor(handler: DataIoServiceHandler) {
        super(PAIRING_SERVICE_UUID, [{
            uuid: PAIRING_GDIO_CHARACTERISTIC_UUID,
            id: PAIRING_GDIO_CHARACTERISTIC
        }], handler);
    }

}
