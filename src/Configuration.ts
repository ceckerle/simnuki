import * as nconf from "nconf";
import {Provider} from "nconf";
import * as _ from "underscore";
import * as uuid from "uuid";
import * as sodium from "sodium";
import {LOCK_STATE_UNCALIBRATED, NUKI_STATE_UNINITIALIZED} from "./Constants";

export interface User {
    authorizationId: number,
    appId: number;
    appType: number;
    sharedSecret: string;
    name: string;
}

export class Configuration {

    private config: Provider;

    constructor() {
        this.config = new nconf.Provider({
            env: true,
            argv: true,
            store: {
                type: 'file',
                file: 'config.json'
            }
        });

        const strUuid = this.config.get('uuid');
        if (!(strUuid && _.isString(strUuid) && strUuid.length === 32)) {
            const arrUUID = new Array(16);
            uuid.v1(null, arrUUID);
            this.config.set('uuid', new Buffer(arrUUID).toString('hex'));
            const nukiSerial = Buffer.alloc(4);
            sodium.api.randombytes_buf(nukiSerial);
            this.config.set('nukiId', nukiSerial.toString('hex').toUpperCase());
            this.config.set('nukiState', NUKI_STATE_UNINITIALIZED);
            this.config.set("lockState", LOCK_STATE_UNCALIBRATED);
            // TODO: init async
            this.save().then(() => console.log("Initial configuration saved"),
                (err) => console.log("Writing initial configuration failed", err));
        } else {
            console.log("SL UUID: " + strUuid);
        }
    }

    public getNukiIdStr(): string {
        return this.get("nukiId");
    }

    public getUuid(): string {
        return this.get("uuid");
    }

    public getNukiState(): number {
        return this.get("nukiState");
    }

    public setNukiState(state: number) {
        this.set("nukiState", state);
    }

    public getLockState(): number {
        return this.get("lockState");
    }

    public setLockState(state: number) {
        return this.set("lockState", state);
    }

    public get(key: string): any {
        return this.config.get(key);
    }

    public set(key: string, value: any): void {
        this.config.set(key, value);
    }

    public save(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.config.save(null, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

}
