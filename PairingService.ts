import * as bleno from "@abandonware/bleno"
import {PairingCharacteristic} from "./PairingCharacteristic";
import {PAIRING_SERVICE_UUID} from "./Constants";

export class PairingService extends bleno.PrimaryService {

    constructor(config: any) {
        super({
            uuid: PAIRING_SERVICE_UUID,
            characteristics: [
                new PairingCharacteristic(config)
            ]
        });
    }

}
