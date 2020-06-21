import * as bleon from "@abandonware/bleno"
import {INITIALIZATION_SERVICE_UUID} from "./Protocol";

export class InitializationService extends bleon.PrimaryService {

    constructor() {
        super({
            uuid: INITIALIZATION_SERVICE_UUID
        });
    }

}