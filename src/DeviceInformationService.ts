import * as bleno from "@abandonware/bleno"

export class DeviceInformationService extends bleno.PrimaryService {

    constructor(serialNumber: string, firmwareVersion: number, hardwareVersion: number) {
        super({
            uuid: "180A",
            characteristics: [
                new bleno.Characteristic({
                    uuid: "2A25",
                    properties: ["read"],
                    value: Buffer.from(serialNumber, "ascii")
                }),
                new bleno.Characteristic({
                    uuid: "2A26",
                    properties: ["read"],
                    value: Buffer.from(DeviceInformationService.formatVersion(firmwareVersion, 3), "ascii")
                }),
                new bleno.Characteristic({
                    uuid: "2A27",
                    properties: ["read"],
                    value: Buffer.from(DeviceInformationService.formatVersion(hardwareVersion, 2), "ascii")
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
