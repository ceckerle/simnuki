import * as bleno from "@abandonware/bleno";
import {Advertiser} from "./Advertiser";
import {Configuration} from "./Configuration";
import {PairingServiceHandler} from "./PairingServiceHandler";
import {KeyturnerServiceHandler} from "./KeyturnerServiceHandler";
import {DataIoPeripheral} from "./DataIoPeripheral";
import {CommandPeripheral} from "./CommandPeripheral";
import {
    FIRMWARE_VERSION,
    HARDWARE_VERSION,
    KEYTURNER_SERVICES
} from "./Protocol";

export class Keyturner {

    private config: Configuration;
    private pairingServiceHandler: PairingServiceHandler;
    private keyturnerServiceHandler: KeyturnerServiceHandler;
    private advertiser: Advertiser;
    private keyturnerPeripheral: DataIoPeripheral;

    constructor() {
        this.config = new Configuration();
        this.pairingServiceHandler = new PairingServiceHandler(this.config);
        this.keyturnerServiceHandler = new KeyturnerServiceHandler(this.config);
        this.advertiser = new Advertiser(this.config);
        const commandPeripheral = new CommandPeripheral([this.pairingServiceHandler.handleCommand, this.keyturnerServiceHandler.handleCommand], (authId) => {
            const user = this.config.getUser(authId);
            return user ? Buffer.from(user.sharedSecret, "hex") : undefined;
        });
        this.keyturnerPeripheral = new DataIoPeripheral(KEYTURNER_SERVICES, {
            serialNumber: this.config.getNukiIdStr(),
            firmwareVersion: FIRMWARE_VERSION,
            hardwareVersion: HARDWARE_VERSION
        }, commandPeripheral.handleDataIo);
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
        this.keyturnerPeripheral.registerServices();
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
        this.keyturnerServiceHandler.reset();
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
