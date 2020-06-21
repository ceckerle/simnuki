import * as bleno from "@abandonware/bleno"
import {PairingCharacteristic} from "./PairingCharacteristic";
import {PAIRING_SERVICE_UUID} from "./Constants";
import {Configuration} from "./Configuration";

export class PairingService extends bleno.PrimaryService {

    constructor(config: Configuration) {
        super({
            uuid: PAIRING_SERVICE_UUID,
            characteristics: [
                new PairingCharacteristic(config)
            ]
        });
    }

}
