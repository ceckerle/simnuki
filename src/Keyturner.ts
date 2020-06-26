import * as bleno from "@abandonware/bleno";
import {Advertiser} from "./Advertiser";
import {PairingService} from "./PairingService";
import {KeyturnerService} from "./KeyturnerService";
import {DeviceInformationService} from "./DeviceInformationService";
import {Configuration} from "./Configuration";

export class Keyturner {

    private config: Configuration;
    private advertiser: Advertiser;
    private keyturnerPairingService: PairingService;
    private keyturnerService: KeyturnerService;
    private deviceInformationService: DeviceInformationService;

    constructor() {
        this.config = new Configuration();
        this.advertiser = new Advertiser(this.config);
        this.keyturnerPairingService = new PairingService(this.config);
        this.keyturnerService = new KeyturnerService(this.config);
        this.deviceInformationService = new DeviceInformationService(this.config);
    }

    async init(): Promise<void> {
        process.env['BLENO_DEVICE_NAME'] = 'Nuki_' + this.config.getNukiIdStr();
        bleno.on('accept', this.onAccept);
        bleno.on('disconnect',this.onDisconnect);
        bleno.on('mtuChange', this.onMtuChange);
        bleno.on('platform', this.onPlatform);
        bleno.on('addressChange', this.onAddressChange);
        bleno.on('rssiUpdate', this.onRssiUpdate);
        bleno.on('servicesSet', this.onServicesSet);
        bleno.setServices([
            this.keyturnerPairingService,
            this.keyturnerService,
            this.deviceInformationService
        ]);
        await this.advertiser.init();
    }

    async destroy(): Promise<void> {
        await this.advertiser.destroy();
    }

    private onAccept = (address: string) => {
        console.log('on -> accept: ' + address);
    }

    private onDisconnect = () => {
        console.log('on -> disconnect');
        this.advertiser.update();
    }

    private onMtuChange = (mtu: number) => {
        console.log('on -> mtuChange: ' + mtu);
    }

    private onPlatform = (pf: string) => {
        console.log('on -> platform: ' + pf);
    }

    private onAddressChange = (ad: string) => {
        console.log('on -> addressChange: ', ad);
    }

    private onRssiUpdate = (rssi: number) => {
        console.log('on -> rssiUpdate: ' + rssi);
    }

    private onServicesSet = (error?: Error|null) => {
        console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
    }

}
