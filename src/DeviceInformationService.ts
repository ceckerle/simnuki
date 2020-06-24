import * as bleno from "@abandonware/bleno"
import {Configuration} from "./Configuration";
import {FIRMWARE_VERSION, HARDWARE_VERSION} from "./Protocol";

export class DeviceInformationService extends bleno.PrimaryService {

    constructor(config: Configuration) {
        super({
            uuid: "180A",
            characteristics: [
                new bleno.Characteristic({
                    uuid: "2A25",
                    properties: ["read"],
                    value: new Buffer(config.getNukiIdStr(), "ascii")
                }),
                new bleno.Characteristic({
                    uuid: "2A26",
                    properties: ["read"],
                    value: new Buffer(DeviceInformationService.formatVersion(FIRMWARE_VERSION, 3), "ascii")
                }),
                new bleno.Characteristic({
                    uuid: "2A27",
                    properties: ["read"],
                    value: new Buffer(DeviceInformationService.formatVersion(HARDWARE_VERSION, 2), "ascii")
                })
            ]
        });
    }

    private static formatVersion(version: number, length: number) {
        let str = "";
        for (let i = length - 1; i >= 0; i--) {
            str += (version >> i * 8 & 0xff).toString();
            if (i > 0) {
                str += "."
            }
        }
        return str;
    }

}
