import * as bleno from "@abandonware/bleno";
import {PAIRING_SERVICE_UUID} from "./Constants";

export class Advertiser {

    constructor(private nukiIdStr: string) {
    }

    public init(): void {
        bleno.on('stateChange', (state) => {
            console.log('on -> stateChange: ' + state);

            if (state === 'poweredOn') {
                // bleno.startAdvertising('SimNuki', [keyturnerPairingService.uuid]);

                bleno.updateRssi((err, rssi) => {
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

                const preBuf = new Buffer("020106", 'hex'); // data type 0x01 means flags (LE General Discoverable Mode, BR/EDR Not Supported (i.e. bit 37 of LMP Extended Feature bits Page 0)

                const typeBuf = new Buffer([0x21]);   // data type 0x21 means "Service Data - 128-bit UUID"
                const uuidBuf = new Buffer(PAIRING_SERVICE_UUID.replace(/-/g, ""), 'hex');
                // console.log("Length of uuid: " + uuidBuf.length);
                const uuidReverseBuf = Buffer.alloc(uuidBuf.length);
                for (let i = 0; i < uuidReverseBuf.length; i++) {
                    uuidReverseBuf[i] = uuidBuf[uuidBuf.length - i - 1];
                }
                const nullBuf = new Buffer([0, 0, 0, 0]);
                const advDataBuf = Buffer.concat([typeBuf, uuidReverseBuf, nullBuf]);
                const len = advDataBuf.length;
                // console.log("Length of adv data: " + len);
                const lenBuf = Buffer.alloc(1);
                lenBuf.writeUInt8(len, 0);


                const advBuf = Buffer.concat([preBuf, lenBuf, advDataBuf]);

                const completeLocalName = 'Nuki_' + this.nukiIdStr;
                const completeLocalNameBuf = new Buffer(completeLocalName, 'ascii');
                const localNamePrefixBuf = Buffer.alloc(2);
                localNamePrefixBuf.writeUInt8(completeLocalNameBuf.length + 1, 0);
                localNamePrefixBuf.writeUInt8(0x09, 1); // data type 0x09 means "Complete Local Name"
                const scanDataBuf = Buffer.concat([localNamePrefixBuf, completeLocalNameBuf]);
                // console.log("Advertising with ", advBuf);
                // console.log("Scan data ", scanDataBuf);
                bleno.startAdvertisingWithEIRData(advBuf, scanDataBuf, (err) => {
                    if (err) {
                        console.log("ERROR: startAdvertisingWithEIRData failed:", err);
                    }
                });
            } else {
                bleno.stopAdvertising();
            }
        });

        bleno.on('advertisingStart', (error) => {
            console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
        });

        bleno.on('advertisingStop', () => {
            console.log('on -> advertisingStop');
        });
    }

}
