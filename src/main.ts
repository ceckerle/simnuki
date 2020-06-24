import * as bleno from "@abandonware/bleno";
import {InitializationService} from "./InitializationService";
import {PairingService} from "./PairingService";
import {KeyturnerService} from "./KeyturnerService";
import {Advertiser} from "./Advertiser";
import {Configuration} from "./Configuration";
import {NUKI_STATE_DOOR_MODE, NUKI_STATE_PAIRING_MODE, NUKI_STATE_UNINITIALIZED} from "./Protocol";
import {DeviceInformationService} from "./DeviceInformationService";

const config = new Configuration();

process.env['BLENO_DEVICE_NAME'] = 'Nuki_' + config.getNukiIdStr();

const advertiser = new Advertiser(config.getNukiIdStr());
advertiser.init();

bleno.on('accept', function (address) {
    console.log('on -> accept: ' + address);
    console.log("Creating new SL key pair...");
    const keyturnerInitializationService = new InitializationService();
    const keyturnerPairingService = new PairingService(config);
    const keyturnerService = new KeyturnerService(config);
    const deviceInformationService = new DeviceInformationService(config);
    const nukiState = config.getNukiState();
    switch (nukiState) {
        case NUKI_STATE_UNINITIALIZED:
            console.log("Nuki state: uninitialized");
            bleno.setServices([
                keyturnerInitializationService,
                keyturnerPairingService,
                keyturnerService,
                deviceInformationService
            ]);
            break;
        case NUKI_STATE_PAIRING_MODE:
            console.log("Nuki state: pairing");
            bleno.setServices([
                keyturnerPairingService,
                keyturnerService,
                deviceInformationService
            ]);
            break;
        case NUKI_STATE_DOOR_MODE:
            console.log("Nuki state: door");
            bleno.setServices([
                deviceInformationService,
                keyturnerService,
                deviceInformationService
            ]);
            break;
        default:
            bleno.setServices([]);
            break;
    }
});

bleno.on('disconnect', function () {
    console.log('on -> disconnect');
});

bleno.on('mtuChange', function (mtu) {
    console.log('on -> mtuChange: ' + mtu);
});

bleno.on('platform', function (pf) {
    console.log('on -> platform: ' + pf);
});

bleno.on('addressChange', function (ad) {
    console.log('on -> addressChange: ', ad);
});

bleno.on('rssiUpdate', function (rssi) {
    console.log('on -> rssiUpdate: ' + rssi);
});

bleno.on('servicesSet', function (error) {
    console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});
