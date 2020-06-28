import * as bleno from "@abandonware/bleno";
import {
    INITIALIZATION_SERVICE_UUID,
    KEYTURNER_SERVICE_UUID,
    NUKI_STATE_DOOR_MODE,
    NUKI_STATE_PAIRING_MODE,
    NUKI_STATE_UNINITIALIZED,
    PAIRING_SERVICE_UUID
} from "./Protocol";
import {Configuration} from "./Configuration";

export class Advertiser {

    private poweredOn = false;
    private advertising = false;
    private advertisingEnabled = false;

    constructor(private config: Configuration) {
    }

    async init(): Promise<void> {
        bleno.on("stateChange", this.onStateChange);
        bleno.on('advertisingStart', this.onAdvertisingStart);
        bleno.on('advertisingStop', this.onAvertisingStop);
        this.advertisingEnabled = true;
        this.updateAdvertising();
    }

    async update(): Promise<void> {
        if (this.advertisingEnabled) {
            this.advertisingEnabled = false;
            this.updateAdvertising();
            this.advertisingEnabled = true;
            this.updateAdvertising();
        }
    }

    async destroy(): Promise<void> {
        this.advertisingEnabled = false;
        this.updateAdvertising();
    }

    private updateAdvertising() {
        const targetState = this.advertisingEnabled && this.poweredOn;
        if (this.advertising === targetState) {
            return;
        }
        if (targetState) {
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

            // data type 0x01 means flags (LE General Discoverable Mode, BR/EDR Not Supported (i.e. bit 37 of LMP Extended Feature bits Page 0)
            const preBuf = Buffer.from("020106", 'hex');

            let uuid;
            switch (this.config.getNukiState()) {
                case NUKI_STATE_UNINITIALIZED:
                    uuid = INITIALIZATION_SERVICE_UUID;
                    break;
                case NUKI_STATE_PAIRING_MODE:
                    uuid = PAIRING_SERVICE_UUID;
                    break;
                case NUKI_STATE_DOOR_MODE:
                default:
                    uuid = KEYTURNER_SERVICE_UUID;
                    break;
            }
            const uuidBuf = Buffer.from(uuid.replace(/-/g, ""), 'hex');

            const nukiIdBuf = Buffer.alloc(4);
            nukiIdBuf.writeUInt32BE(parseInt(this.config.getNukiIdStr(), 16), 0);

            const advBuf = Buffer.concat([preBuf, this.config.getNukiState() === NUKI_STATE_DOOR_MODE ?
                this.buildBeaconAdvertising(uuidBuf, nukiIdBuf) :
                this.buildServiceDataAdvertising(uuidBuf, nukiIdBuf)]);

            const completeLocalName = 'Nuki_' + this.config.getNukiIdStr();
            const completeLocalNameBuf = Buffer.from(completeLocalName, 'ascii');
            const localNamePrefixBuf = Buffer.alloc(2);
            localNamePrefixBuf.writeUInt8(completeLocalNameBuf.length + 1, 0);
            localNamePrefixBuf.writeUInt8(0x09, 1); // data type 0x09 means "Complete Local Name"
            const scanDataBuf = Buffer.concat([localNamePrefixBuf, completeLocalNameBuf]);

            console.log("Advertising with ", advBuf.toString("hex"));
            console.log("Scan data ", scanDataBuf.toString("hex"));
            bleno.startAdvertisingWithEIRData(advBuf, scanDataBuf, (err) => {
                if (err) {
                    console.log("ERROR: startAdvertisingWithEIRData failed:", err);
                }
            });
        } else {
            bleno.stopAdvertising();
        }
    }

    private buildServiceDataAdvertising(uuid: Buffer, nukiId: Buffer): Buffer {
        // data type 0x21 means "Service Data - 128-bit UUID"
        const typeBuf = Buffer.from([0x21]);
        const advDataBuf = Buffer.concat([typeBuf, uuid.reverse(), nukiId]);
        const len = advDataBuf.length;
        const lenBuf = Buffer.alloc(1);
        lenBuf.writeUInt8(len, 0);
        return Buffer.concat([lenBuf, advDataBuf]);
    }

    private buildBeaconAdvertising(uuid: Buffer, nukiId: Buffer): Buffer {
        // manufacturer specific data field with apple ibeacon header
        const headerBuf = Buffer.from("1aff4c000215", "hex");
        // signal strength
        const sigStrBuf = Buffer.from("c4", "hex");
        return Buffer.concat([headerBuf, uuid, nukiId, sigStrBuf]);
    }

    private onStateChange = (state: string) => {
        console.log('on -> stateChange: ' + state);
        this.poweredOn = state === "poweredOn";
        this.updateAdvertising();
    }

    private onAdvertisingStart = (error?: Error|null) => {
        console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
    }

    private onAvertisingStop = () => {
        console.log('on -> advertisingStop');
    }

}
