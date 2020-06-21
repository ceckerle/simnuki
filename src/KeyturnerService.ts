import * as bleno from "@abandonware/bleno";
import {KeyturnerUserSpecificCharacteristic} from "./KeyturnerUserSpecificCharacteristic";
import {KeyturnerGeneralCharacteristic} from "./KeyturnerGeneralCharacteristic";
import {KEYTURNER_SERVICE_UUID} from "./Constants";
import {Provider} from "nconf";

export class KeyturnerService extends bleno.PrimaryService {

    constructor(config: Provider) {
        super({
            uuid: KEYTURNER_SERVICE_UUID,
            characteristics: [
                new KeyturnerGeneralCharacteristic(),
                new KeyturnerUserSpecificCharacteristic(config)
            ]
        });
    }

}
