import * as bleno from "@abandonware/bleno";
import {InitializationService} from "./InitializationService";
import {PairingService} from "./PairingService";
import {KeyturnerService} from "./KeyturnerService";
import {Advertiser} from "./Advertiser";
import {Configuration} from "./Configuration";

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
    const lockState = config.get("lockState");
    if (lockState > 0) {
        if (config.get('pairingEnabled') === null || config.get('pairingEnabled') === 1) {
            console.log("Pairing is enabled");
            bleno.setServices([
                keyturnerPairingService,
                keyturnerService
            ]);
        } else {
            bleno.setServices([
                keyturnerService
            ]);
        }
    } else {
        console.log("Nuki is not initialized");
        bleno.setServices([
            keyturnerInitializationService,
            keyturnerPairingService,
            keyturnerService
        ]);
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
