import * as bleno from "@abandonware/bleno";
import {Advertiser} from "./Advertiser";
import {PairingService} from "./PairingService";
import {KeyturnerService} from "./KeyturnerService";
import {DeviceInformationService} from "./DeviceInformationService";
import {Configuration} from "./Configuration";
import {PairingServiceHandler} from "./PairingServiceHandler";
import {KeyturnerServiceHandler} from "./KeyturnerServiceHandler";

export class Keyturner {

    private config: Configuration;
    private pairingServiceHandler: PairingServiceHandler;
    private keyturnerServiceHandler: KeyturnerServiceHandler;
    private advertiser: Advertiser;
    private keyturnerPairingService: PairingService;
    private keyturnerService: KeyturnerService;
    private deviceInformationService: DeviceInformationService;

    constructor() {
        this.config = new Configuration();
        this.pairingServiceHandler = new PairingServiceHandler(this.config);
        this.keyturnerServiceHandler = new KeyturnerServiceHandler(this.config);
        this.advertiser = new Advertiser(this.config);
        this.keyturnerPairingService = new PairingService(
            this.pairingServiceHandler.handleRequest.bind(this.pairingServiceHandler)
        );
        this.keyturnerService = new KeyturnerService(
            this.keyturnerServiceHandler.handleRequest.bind(this.keyturnerServiceHandler)
        );
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
        this.pairingServiceHandler.reset();
        this.keyturnerPairingService.reset();
        this.keyturnerServiceHandler.reset();
        this.keyturnerService.reset();
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
