import * as nconf from "nconf";
import {Provider} from "nconf";
import * as _ from "underscore";
import * as uuid from "uuid";
import {LOCK_STATE_UNCALIBRATED, NUKI_STATE_UNINITIALIZED} from "./Protocol";
import {random} from "./Crypto";

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
            const nukiId = random(4).toString("hex").toUpperCase();
            this.config.set('nukiId', nukiId);
            this.config.set('name', "Nuki_" + nukiId);
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

    public getName(): string {
        return this.get("name");
    }

    public setName(name: string):void {
        this.set("name", name);
    }

    public getNukiState(): number {
        return this.get("nukiState");
    }

    public setNukiState(state: number): void {
        this.set("nukiState", state);
    }

    public getLockState(): number {
        return this.get("lockState");
    }

    public setLockState(state: number): void {
        return this.set("lockState", state);
    }

    public getUsers(): {[authorizationId: string]: User} {
        return this.get("users");
    }

    public getUsersArray(): User[] {
        const users = this.getUsers();
        const usersArray = Object.getOwnPropertyNames(users).map((authId) => users[authId]);
        usersArray.sort((a, b) => a.authorizationId - b.authorizationId);
        return usersArray;
    }

    public getUser(authorizationId: number): User|undefined {
        return this.getUsers()[authorizationId];
    }

    public getNextAuthorizationId(): number {
        const users = this.getUsers();
        return Object.getOwnPropertyNames(users)
            .map((authId) => users[authId].authorizationId)
            .reduce((max, authId) => Math.max(max, authId), 0) + 1;
    }

    public addOrReplaceUser(user: User): number {
        const users = this.getUsers();
        this.set("users", {
            ...users,
            [user.authorizationId]: user
        });
        return user.authorizationId;
    }

    public removeUser(authorizationId: number): void {
        const users = {
            ...this.getUsers()
        };
        delete users[authorizationId];
        this.set("users", users);
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
