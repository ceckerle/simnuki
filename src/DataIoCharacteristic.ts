import * as bleno from "@abandonware/bleno"

export class DataIoCharacteristic extends bleno.Characteristic {

    private subscriptionCallback?: (data: Buffer) => void;
    private subscriptionLimit = 0;

    constructor(public id: number, uuid: string, writeOnly: boolean, private writeHandler: (data: Buffer) => void, private indicationHandler: () => void) {
        super({
            uuid,
            properties: writeOnly ? ["writeWithoutResponse"] : ['read', 'write', 'indicate'],
            descriptors: [
                new bleno.Descriptor({
                    uuid: '2902',
                    value: Buffer.alloc(2)
                })
            ]
        });
    }

    getIndicationLimit(): number {
        return this.subscriptionLimit;
    }

    sendIndication(data: Buffer): void {
        if (!this.subscriptionCallback) {
            throw new Error("Not subscribed");
        }
        this.subscriptionCallback(data);
    }

    onWriteRequest(data: Buffer, offset: number, withoutResponse: boolean, callback: (result: number) => void): void {
        if (offset) {
            callback(this.RESULT_ATTR_NOT_LONG);
        } else {
            callback(this.RESULT_SUCCESS);
            this.writeHandler(data);
        }
    }

    onSubscribe(maxValueSize: number, updateValueCallback: (data: Buffer) => void): void {
        this.subscriptionCallback = updateValueCallback;
        this.subscriptionLimit = maxValueSize;
    }

    onUnsubscribe(): void {
        this.subscriptionCallback = undefined;
        this.subscriptionLimit = 0;
    }

    onIndicate(): void {
        this.indicationHandler();
    }

}
