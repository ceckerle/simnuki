import * as _ from "underscore";
import * as path from "path";
import * as nconf from "nconf";
import * as bleno from "@abandonware/bleno";
import * as sodium from "sodium";
import * as uuid from "uuid";
import {PAIRING_SERVICE_UUID} from "./Constants";
import {InitializationService} from "./InitializationService";
import {PairingService} from "./PairingService";
import {KeyturnerService} from "./KeyturnerService";

var config = new nconf.Provider({
    env: true,
    argv: true,
    store: {
        type: 'file',
        file: path.join(__dirname, 'config.json')
    }
});

var strUuid = config.get('uuid');
var nukiIdStr = config.get('nukiId');
if (!(strUuid && _.isString(strUuid) && strUuid.length === 32)) {
    var arrUUID = new Array(16);
    uuid.v1(null, arrUUID);
    config.set('uuid', new Buffer(arrUUID).toString('hex'));
    var nukiSerial = Buffer.alloc(4);
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


bleno.on('stateChange', function (state) {
    console.log('on -> stateChange: ' + state);

    if (state === 'poweredOn') {
        // bleno.startAdvertising('SimNuki', [keyturnerPairingService.uuid]);

        bleno.updateRssi(function (err, rssi) {
            if (err) {
                console.log("ERROR: RSSI update failed", err);
            } else {
                console.log("RSSI updated", rssi);
            }
        });

        // EIR data consists of multiple messages in the format:
        //  len (including command byte)
        //  data type (see https://www.bluetooth.com/specifications/assigned-numbers/Generic-Access-Profile)
        //  message data

        var preBuf = new Buffer("020106", 'hex'); // data type 0x01 means flags (LE General Discoverable Mode, BR/EDR Not Supported (i.e. bit 37 of LMP Extended Feature bits Page 0)

        var typeBuf = new Buffer([0x21]);   // data type 0x21 means "Service Data - 128-bit UUID"
        var uuidBuf = new Buffer(PAIRING_SERVICE_UUID.replace(/-/g, ""), 'hex');
        // console.log("Length of uuid: " + uuidBuf.length);
        var uuidReverseBuf = Buffer.alloc(uuidBuf.length);
        for (var i = 0; i < uuidReverseBuf.length; i++) {
            uuidReverseBuf[i] = uuidBuf[uuidBuf.length - i - 1];
        }
        var nullBuf = new Buffer([0, 0, 0, 0]);
        var advDataBuf = Buffer.concat([typeBuf, uuidReverseBuf, nullBuf]);
        var len = advDataBuf.length;
        // console.log("Length of adv data: " + len);
        var lenBuf = Buffer.alloc(1);
        lenBuf.writeUInt8(len, 0);


        var advBuf = Buffer.concat([preBuf, lenBuf, advDataBuf]);

        var completeLocalName = 'Nuki_' + nukiIdStr;
        var completeLocalNameBuf = new Buffer(completeLocalName, 'ascii');
        var localNamePrefixBuf = Buffer.alloc(2);
        localNamePrefixBuf.writeUInt8(completeLocalNameBuf.length + 1, 0);
        localNamePrefixBuf.writeUInt8(0x09, 1); // data type 0x09 means "Complete Local Name"
        var scanDataBuf = Buffer.concat([localNamePrefixBuf, completeLocalNameBuf]);
        // console.log("Advertising with ", advBuf);
        // console.log("Scan data ", scanDataBuf);
        bleno.startAdvertisingWithEIRData(advBuf, scanDataBuf, function (err) {
            if (err) {
                console.log("ERROR: startAdvertisingWithEIRData failed:", err);
            }
        });
    } else {
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function (error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
});

bleno.on('accept', function (address) {
    console.log('on -> accept: ' + address);
    console.log("Creating new SL key pair...");
    var keyturnerInitializationService = new InitializationService();
    var keyturnerPairingService = new PairingService(config);
    var keyturnerService = new KeyturnerService(config);
    var lockState = config.get("lockState");
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
