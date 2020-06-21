import * as _ from "underscore";
import * as nconf from "nconf";
import * as bleno from "@abandonware/bleno";
import * as sodium from "sodium";
import * as uuid from "uuid";
import {InitializationService} from "./InitializationService";
import {PairingService} from "./PairingService";
import {KeyturnerService} from "./KeyturnerService";
import {Advertiser} from "./Advertiser";

const config = new nconf.Provider({
    env: true,
    argv: true,
    store: {
        type: 'file',
        file: 'config.json'
    }
});

const strUuid = config.get('uuid');
let nukiIdStr = config.get('nukiId');
if (!(strUuid && _.isString(strUuid) && strUuid.length === 32)) {
    const arrUUID = new Array(16);
    uuid.v1(null, arrUUID);
    config.set('uuid', new Buffer(arrUUID).toString('hex'));
    const nukiSerial = Buffer.alloc(4);
    sodium.api.randombytes_buf(nukiSerial);
    nukiIdStr = nukiSerial.toString('hex').toUpperCase();
    config.set('nukiId', nukiIdStr);
    config.set('nukiState', 0); // not initialized
    config.save(null,function (err) {
        if (err) {
            console.log("Writing configuration failed", err);
        } else {
            console.log("Initial configuration saved");
        }
    });
} else {
    console.log("SL UUID: " + strUuid);
}

process.env['BLENO_DEVICE_NAME'] = 'Nuki_' + nukiIdStr;

const advertiser = new Advertiser(nukiIdStr);
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
