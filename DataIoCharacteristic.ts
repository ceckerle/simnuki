import * as bleno from "@abandonware/bleno"

export abstract class DataIoCharacteristic extends bleno.Characteristic {

    private pendingIndicationPromise: Promise<void> = Promise.resolve();
    private pendingIndicationPromiseResolve: () => void = () => undefined;
    private pendingIndicationData: Buffer = Buffer.alloc(0);
    private pendingIndicationOffset: number = 0;
    private subscriptionCallback?: (data: Buffer) => void;
    private subscriptionLimit: number = 0;

    constructor(uuid: string) {
        super({
            uuid,
            properties: ['write', 'indicate'],
            descriptors: [
                new bleno.Descriptor({
                    uuid: '2902',
                    value: Buffer.alloc(2)
                })
            ]
        });
    }

    onWriteRequest(data: Buffer, offset: number, withoutResponse: boolean, callback: (result: number) => void) {
        console.log(`onWriteRequest ${data.toString("hex")} ${offset} ${withoutResponse}`);
        if (offset) {
            callback(this.RESULT_ATTR_NOT_LONG);
        } else {
            callback(this.RESULT_SUCCESS);
            this.handleRequest(data).then((data) => {
                console.log("will send " + data.toString("hex"));
                this.sendIndication(data);
            }, (error) => {
                console.log("handleRequest failure", error);
            });
        }
    }

    onSubscribe(maxValueSize: number, updateValueCallback: (data: Buffer) => void) {
        this.subscriptionCallback = updateValueCallback;
        this.subscriptionLimit = maxValueSize;
    }

    onUnsubscribe() {
        this.subscriptionCallback = undefined;
        this.subscriptionLimit = 0;
    }

    onIndicate() {
        setTimeout(() => {
            this.processPendingIndication();
        }, 0);
    }

    protected abstract handleRequest(data: Buffer): Promise<Buffer>;

    protected async sendIndication(data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pendingIndicationPromise.finally(() => {
                this.pendingIndicationPromiseResolve = resolve;
                this.pendingIndicationData = data;
                this.pendingIndicationOffset = 0;
                this.processPendingIndication();
            })
        });
    }

    private processPendingIndication() {
        const remaining = this.pendingIndicationData.length - this.pendingIndicationOffset;
        console.log(`processPendingIndication ${this.pendingIndicationOffset}/${this.pendingIndicationData.length}`);
        if (remaining > 0) {
            if (!this.subscriptionCallback || !this.subscriptionLimit) {
                console.log("no subscription, dropping indication");
                this.pendingIndicationOffset = this.pendingIndicationData.length;
                this.processPendingIndication();
                return;
            }
            const sendLength = Math.min(remaining, this.subscriptionLimit);
            const sendData = this.pendingIndicationData.subarray(this.pendingIndicationOffset, this.pendingIndicationOffset + sendLength);
            console.log("sending " + sendData.toString("hex"));
            this.subscriptionCallback(sendData);
            this.pendingIndicationOffset += sendLength;
        } else {
            this.pendingIndicationPromiseResolve();
        }
    }

}
