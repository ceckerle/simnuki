import * as bleno from "@abandonware/bleno"
import {PairingCharacteristic} from "./PairingCharacteristic";
import {PAIRING_SERVICE_UUID} from "./Constants";
import {Provider} from "nconf";

export class PairingService extends bleno.PrimaryService {

    constructor(config: Provider) {
        super({
            uuid: PAIRING_SERVICE_UUID,
            characteristics: [
                new PairingCharacteristic(config)
            ]
        });
    }

}
