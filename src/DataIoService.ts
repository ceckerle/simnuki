import * as bleno from "@abandonware/bleno"
import {DataIoCharacteristic} from "./DataIoCharacteristic";

export type DataIoServiceHandler = (data: Buffer, characteristicId: number, sendAsync: (data: Buffer, characteristicId: number) => Promise<void>) => Promise<void>;

export class DataIoService extends bleno.PrimaryService {

    private chars: DataIoCharacteristic[] = [];

    private pendingIndicationPromise: Promise<void> = Promise.resolve();
    private pendingIndicationPromiseResolve: () => void = () => undefined;
    private pendingIndicationCharacteristic?: DataIoCharacteristic;
    private pendingIndicationData: Buffer = Buffer.alloc(0);
    private pendingIndicationOffset = 0;

    constructor(uuid: string, characteristics: {uuid: string, id: number, writeOnly?: boolean}[], private handler: DataIoServiceHandler) {
        super({
            uuid,
            characteristics: characteristics.map((c) =>  new DataIoCharacteristic(
                c.id,
                c.uuid,
                c.writeOnly ?? false,
                (data) => this.onWrite(data, c.id),
                () => this.onIndicate()
            ))
        });
        this.chars = this.characteristics as DataIoCharacteristic[];
    }

    onWrite(data: Buffer, characteristicId: number): void {
        // console.log(`onWrite ${data.toString("hex")} ${characteristicId}`);
        this.handler(data, characteristicId, this.sendIndication).catch((error) => {
            console.log("handleRequest failure", error);
        });
    }

    onIndicate(): void {
        setTimeout(() => {
            this.processPendingIndication();
        }, 0);
    }

    protected sendIndication = async (data: Buffer, characteristicId: number): Promise<void> => {
        return this.pendingIndicationPromise.finally(() => {
            new Promise((resolve, reject) => {
                this.pendingIndicationPromiseResolve = resolve;
                this.pendingIndicationCharacteristic = this.chars.find((c) => c.id === characteristicId);
                if (!this.pendingIndicationCharacteristic) {
                    reject(new Error(`Invalid characteristic id ${characteristicId.toString(16)}`));
                    return;
                }
                this.pendingIndicationData = data;
                this.pendingIndicationOffset = 0;
                this.processPendingIndication();
            });
        });
    }

    private processPendingIndication() {
        const remaining = this.pendingIndicationData.length - this.pendingIndicationOffset;
        // console.log(`processPendingIndication ${this.pendingIndicationOffset}/${this.pendingIndicationData.length}`);
        if (remaining > 0) {
            if (!this.pendingIndicationCharacteristic) {
                console.log("no characteristic, dropping indication");
                this.pendingIndicationOffset = this.pendingIndicationData.length;
                this.processPendingIndication();
                return;
            }
            const limit = this.pendingIndicationCharacteristic.getIndicationLimit();
            if (limit === 0) {
                console.log("no subscription, dropping indication");
                this.pendingIndicationOffset = this.pendingIndicationData.length;
                this.processPendingIndication();
                return;
            }
            const sendLength = Math.min(remaining, limit);
            const sendData = this.pendingIndicationData.subarray(this.pendingIndicationOffset, this.pendingIndicationOffset + sendLength);
            // console.log("sending " + sendData.toString("hex"));
            this.pendingIndicationCharacteristic.sendIndication(sendData);
            this.pendingIndicationOffset += sendLength;
        } else {
            this.pendingIndicationPromiseResolve();
        }
    }

}
