import * as bleno from "@abandonware/bleno";
import {DataIoService} from "./DataIoService";
import {DeviceInformationService} from "./DeviceInformationService";

export type DataIoPeripheralHandler = (data: Buffer, characteristicId: number, sendAsync: (data: Buffer, characteristicId: number) => Promise<void>, disconnect: () => void) => Promise<void>;

export class DataIoPeripheral {

    private services: (DataIoService|DeviceInformationService)[];

    constructor(services: {
        uuid: string;
        characteristics: {
            id: number;
            uuid: string;
            writeOnly?: boolean;
        }[]
    }[], deviceInformation: {
        serialNumber: string;
        hardwareVersion: number;
        firmwareVersion: number;
    }, handler: DataIoPeripheralHandler) {
        this.services = services.map((s) => new DataIoService(s.uuid, s.characteristics, handler));
        this.services.push(new DeviceInformationService(deviceInformation.serialNumber, deviceInformation.firmwareVersion, deviceInformation.hardwareVersion));
    }

    registerServices(): void {
        bleno.setServices(this.services);
    }

}
