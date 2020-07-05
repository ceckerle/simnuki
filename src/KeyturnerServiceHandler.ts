import {Configuration} from "./Configuration";
import {random} from "./Crypto";
import {
    DOOR_SENSOR_STATE_CALIBRATING,
    DOOR_SENSOR_STATE_CLOSED,
    DOOR_SENSOR_STATE_DEACTIVATED,
    FIRMWARE_VERSION,
    FOB_ACTION_INTELLIGENT,
    FOB_ACTION_LOCK,
    FOB_ACTION_LOCKNGO,
    FOB_ACTION_NONE,
    FOB_ACTION_UNLOCK,
    HARDWARE_VERSION, HOMEKIT_STATUS_ENABLED,
    KEYTURNER_USDIO_CHARACTERISTIC,
    LOCK_ACTION_FOB_ACTION_1,
    LOCK_ACTION_FOB_ACTION_2,
    LOCK_ACTION_FOB_ACTION_3,
    LOCK_ACTION_FULL_LOCK,
    LOCK_ACTION_LOCK,
    LOCK_ACTION_LOCKNGO,
    LOCK_ACTION_LOCKNGO_WITH_UNLATCH,
    LOCK_ACTION_UNLATCH,
    LOCK_ACTION_UNLOCK,
    LOCK_STATE_LOCKED,
    LOCK_STATE_LOCKING,
    LOCK_STATE_UNLATCHED,
    LOCK_STATE_UNLOCKED,
    LOCK_STATE_UNLOCKING,
    NUKI_NONCEBYTES,
    NUKI_STATE_DOOR_MODE,
    NUKI_STATE_PAIRING_MODE,
    NUKI_STATE_UNINITIALIZED
} from "./Protocol";
import {
    CMD_CHALLENGE,
    CMD_FIRMWARE_STATUS,
    CMD_KEYTURNER_STATES,
    ERROR_UNKNOWN,
    K_ERROR_BAD_NONCE,
    K_ERROR_BAD_PARAMETER,
    K_ERROR_BAD_PIN,
    K_ERROR_INVALID_AUTH_ID,
    STATUS_ACCEPTED,
    STATUS_COMPLETE
} from "./command/Constants";
import {Command} from "./command/Command";
import {RequestDataCommand} from "./command/RequestDataCommand";
import {ErrorCommand} from "./command/ErrorCommand";
import {ChallengeCommand} from "./command/ChallengeCommand";
import {FirmwareStatusCommand} from "./command/FirmwareStatusCommand";
import {RequestConfigCommand} from "./command/RequestConfigCommand";
import {ConfigCommand} from "./command/ConfigCommand";
import {SetConfigCommand} from "./command/SetConfigCommand";
import {StatusCommand} from "./command/StatusCommand";
import {VerifySecurityPinCommand} from "./command/VerifySecurityPinCommand";
import {RequestAdvancedConfigCommand} from "./command/RequestAdvancedConfigCommand";
import {AdvancedConfigCommand} from "./command/AdvancedConfigCommand";
import {UpdateTimeCommand} from "./command/UpdateTimeCommand";
import {LockActionCommand} from "./command/LockActionCommand";
import {RequestCalibrationCommand} from "./command/RequestCalibrationCommand";
import {SetSecurityPinCommand} from "./command/SetSecurityPinCommand";
import {RemoveAuthorizationEntryCommand} from "./command/RemoveAuthorizationEntryCommand";
import {KeyturnerStatesCommand} from "./command/KeyturnerStatesCommand";
import {SetAdvancedConfigCommand} from "./command/SetAdvancedConfigCommand";
import {CommandNeedsChallenge} from "./command/CommandNeedsChallenge";
import {CommandNeedsSecurityPin} from "./command/CommandNeedsSecurityPin";
import {RequestAuthorizationEntriesCommand} from "./command/RequestAuthorizationEntriesCommand";
import {AuthorizationEntryCountCommand} from "./command/AuthorizationEntryCountCommand";
import {AuthorizationEntryCommand} from "./command/AuthorizationEntryCommand";
import {UpdateAuthorizationEntryCommand} from "./command/UpdateAuthorizationEntryCommand";
import {RequestLogEntriesCommand} from "./command/RequestLogEntriesCommand";
import {LogEntryCountCommand} from "./command/LogEntryCountCommand";
import {EnableLoggingCommand} from "./command/EnableLoggingCommand";
import {AuthorizationDataInviteCommand} from "./command/AuthorizationDataInviteCommand";
import {AuthorizationIdInviteCommand} from "./command/AuthorizationIdInviteCommand";
import {DateTime} from "./command/DateTime";
import {RequestDoorSensorConfigurationCommand} from "./command/RequestDoorSensorConfigurationCommand";
import {DoorSensorConfigurationCommand} from "./command/DoorSensorConfigurationCommand";
import {RequestDoorSensorCalibrationCommand} from "./command/RequestDoorSensorCalibrationCommand";
import {SetHomeKitConfigurationCommand} from "./command/SetHomeKitConfigurationCommand";
import {SetDoorSensorConfigurationCommand} from "./command/SetDoorSensorConfigurationCommand";
import {EnableDoorSensorLoggingCommand} from "./command/EnableDoorSensorLoggingCommand";

interface KeyturnerStateInitial {
    key: "Initial"
}

interface KeyturnerStateChallengeSent {
    key: "ChallengeSent"
    challenge: Buffer;
}

type KeyturnerState = KeyturnerStateInitial|KeyturnerStateChallengeSent;

export class KeyturnerServiceHandler {

    private state: KeyturnerState = {
        key: "Initial"
    };

    constructor(private config: Configuration) {
    }

    reset(): void {
        this.state = {
            key: "Initial"
        }
    }

    handleCommand = async (request: {command: Command, characteristicId: number, authorizationId?: number}, sendCommand: (command: Command) => Promise<void>): Promise<Command|false> => {
        if (request.characteristicId !== KEYTURNER_USDIO_CHARACTERISTIC) {
            return false;
        }

        const command = request.command;

        if (command instanceof CommandNeedsChallenge) {
            if (this.state.key !== "ChallengeSent") {
                return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
            }
            if (Buffer.compare(this.state.challenge, command.nonce) !== 0) {
                return new ErrorCommand(K_ERROR_BAD_NONCE, command.id, "ERROR: nonce differ");
            }
            this.state = {
                key: "Initial"
            };
        } else if (this.state.key !== "Initial") {
            return new ErrorCommand(ERROR_UNKNOWN, command.id, `unexpected state ${this.state.key} for command ${command.id}`);
        }
        if (command instanceof CommandNeedsSecurityPin) {
            if (command.securityPin !== this.config.getAdminPin()) {
                return new ErrorCommand(K_ERROR_BAD_PIN, command.id, `ERROR: bad pin ${command.securityPin}`);
            }
        }
        if (command instanceof RequestDataCommand) {
            switch (command.commandId) {
                case CMD_CHALLENGE:
                    const challenge = new ChallengeCommand(random(NUKI_NONCEBYTES));
                    this.state = {
                        key: "ChallengeSent",
                        challenge: challenge.nonce
                    }
                    return challenge;
                case CMD_KEYTURNER_STATES:
                    return this.buildStateCommand();
                case CMD_FIRMWARE_STATUS:
                    return new FirmwareStatusCommand(FIRMWARE_VERSION);
                default:
                    return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad request data ${command.commandId}`);
            }
        } else if (command instanceof RequestConfigCommand) {
            const now = new Date();
            return new ConfigCommand(
                parseInt(this.config.getNukiIdStr(), 16),
                this.config.getName(),
                this.config.get("latitude") ?? 0,
                this.config.get("longitude") ?? 0,
                this.config.get("autoUnlatch") ?? false,
                this.config.getNukiState() === NUKI_STATE_UNINITIALIZED || this.config.getNukiState() === NUKI_STATE_PAIRING_MODE,
                this.config.get("buttonEnabled") ?? true,
                this.config.get("ledFlashEnabled") ?? true,
                this.config.get("ledBrightness") ?? 3,
                DateTime.fromDate(now),
                0,
                false,
                false,
                this.config.get("fobAction1") ?? FOB_ACTION_INTELLIGENT,
                this.config.get("fobAction2") ?? FOB_ACTION_UNLOCK,
                this.config.get("fobAction3") ?? FOB_ACTION_LOCK,
                false,
                0,
                false,
                FIRMWARE_VERSION,
                HARDWARE_VERSION,
                HOMEKIT_STATUS_ENABLED,
                37
            );
        } else if (command instanceof SetConfigCommand) {
            this.config.setName(command.name);
            this.config.set("latitude", command.latitude);
            this.config.set("longitude", command.longitude);
            this.config.set("autoUnlatch", command.autoUnlatch);
            this.config.set("buttonEnabled", command.buttonEnabled);
            this.config.set("ledFlashEnabled", command.ledEnabled);
            this.config.set("ledBrightness", command.ledBrightness);
            this.config.set("dstMode", command.dstMode);
            this.config.set("fobAction1", command.fobAction1);
            this.config.set("fobAction2", command.fobAction2);
            this.config.set("fobAction3", command.fobAction3);

            let nukiState = this.config.getNukiState();

            // exit uninitialized state on first config write
            if (nukiState == NUKI_STATE_UNINITIALIZED) {
                nukiState = NUKI_STATE_DOOR_MODE;
            } else {
                // use pairing mode config flag to emulate pairing button
                if (command.pairingEnabled) {
                    if (nukiState === NUKI_STATE_DOOR_MODE) {
                        nukiState = NUKI_STATE_PAIRING_MODE;
                    }
                } else {
                    if (nukiState === NUKI_STATE_PAIRING_MODE) {
                        nukiState = NUKI_STATE_DOOR_MODE;
                    }
                }
            }
            this.config.setNukiState(nukiState);

            await this.config.save();
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof VerifySecurityPinCommand) {
            // pin already verified

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestAdvancedConfigCommand) {
            // TODO: implement

            return new AdvancedConfigCommand(
                0,
                0,
                0,
                0,
                0,
                0x14,
                0x01,
                0x05,
                false,
                0x00,
                true,
                0x03,
                0x0000
            );
        } else if (command instanceof SetAdvancedConfigCommand) {
            // TODO: implement

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof UpdateTimeCommand) {
            // ignore

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof LockActionCommand) {
            const lockAction = command.lockAction;
            let action = lockAction;
            const currentLockState = this.config.getLockState();
            if (lockAction === LOCK_ACTION_FOB_ACTION_1 || lockAction === LOCK_ACTION_FOB_ACTION_2 || lockAction === LOCK_ACTION_FOB_ACTION_3) {
                const fobAction = this.config.get(`fobAction${lockAction & 0xf}`);
                switch (fobAction) {
                    case FOB_ACTION_UNLOCK:
                        action = LOCK_ACTION_UNLOCK;
                        break;
                    case FOB_ACTION_LOCK:
                        action = LOCK_ACTION_LOCK;
                        break;
                    case FOB_ACTION_LOCKNGO:
                        action = LOCK_ACTION_LOCKNGO;
                        break;
                    case FOB_ACTION_INTELLIGENT:
                        if (currentLockState === LOCK_STATE_LOCKED) {
                            action = LOCK_ACTION_UNLOCK;
                        } else {
                            if (currentLockState === LOCK_STATE_UNLOCKED || currentLockState === LOCK_STATE_UNLATCHED) {
                                action = LOCK_ACTION_LOCK;
                            }
                        }
                        break;
                    case FOB_ACTION_NONE:
                    default:
                        return new StatusCommand(STATUS_COMPLETE);
                }

            }
            const transitions = [];
            switch (action) {
                case LOCK_ACTION_UNLOCK:
                    transitions.push(LOCK_STATE_UNLOCKING);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    break;
                case LOCK_ACTION_LOCK:
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                case LOCK_ACTION_UNLATCH:
                    transitions.push(LOCK_STATE_UNLOCKING);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    transitions.push(LOCK_STATE_UNLATCHED);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    break;
                case LOCK_ACTION_LOCKNGO:
                    transitions.push(LOCK_STATE_UNLOCKING);
                    transitions.push(LOCK_STATE_UNLOCKED);
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                case LOCK_ACTION_LOCKNGO_WITH_UNLATCH:
                    transitions.push(LOCK_STATE_UNLOCKING)
                    transitions.push(LOCK_STATE_UNLOCKED);
                    transitions.push(LOCK_STATE_UNLATCHED);
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                case LOCK_ACTION_FULL_LOCK:
                    transitions.push(LOCK_STATE_LOCKING);
                    transitions.push(LOCK_STATE_LOCKED);
                    break;
                default:
                    return new ErrorCommand(K_ERROR_BAD_PARAMETER, command.id, "ERROR: lock action sent with unknown lock action (" + lockAction + "). Ignoring.");
            }
            if (transitions.length > 0) {
                await sendCommand(new StatusCommand(STATUS_ACCEPTED));
            }

            await this.sleep(2);

            for (const nextState of transitions) {
                this.config.setLockState(nextState);
                await sendCommand(this.buildStateCommand());
                await this.sleep(1);
            }

            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestCalibrationCommand) {
            await sendCommand(new StatusCommand(STATUS_ACCEPTED));
            await this.sleep(2);
            // TODO: calibration status updates
            this.config.setLockState(LOCK_STATE_LOCKED);
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof SetSecurityPinCommand) {
            console.log("Set new PIN: ", command.pin);
            this.config.setAdminPin(command.pin);
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RemoveAuthorizationEntryCommand) {
            const user = this.config.getUser(command.authorizationId);
            if (!user) {
                return new ErrorCommand(K_ERROR_INVALID_AUTH_ID, command.id, `User does not exist ${command.authorizationId}`);
            }

            this.config.removeUser(command.authorizationId);
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestAuthorizationEntriesCommand) {
            const users = this.config.getUsersArray();
            if (command.offset === 0) {
                await sendCommand(new AuthorizationEntryCountCommand(users.length));
            }
            for (const user of users.slice(command.offset, command.offset + command.count)) {
                await sendCommand(new AuthorizationEntryCommand(
                    user.authorizationId,
                    user.appType,
                    user.name,
                    true,
                    true
                ));
            }
            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof UpdateAuthorizationEntryCommand) {
            const user = this.config.getUser(command.authorizationId);
            if (!user) {
                return new ErrorCommand(K_ERROR_INVALID_AUTH_ID, command.id, `User does not exist ${command.authorizationId}`);
            }

            this.config.addOrReplaceUser({
                ...user,
                name: command.name
            });
            await this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof AuthorizationDataInviteCommand) {
            const authorizationId = this.config.getNextAuthorizationId();
            this.config.addOrReplaceUser({
                authorizationId: authorizationId,
                appId: 0,
                appType: command.idType,
                name: command.name,
                sharedSecret: command.sharedKey.toString("hex")
            });
            await this.config.save();

            return new AuthorizationIdInviteCommand(authorizationId, DateTime.fromDate(new Date()));
        } else if (command instanceof RequestLogEntriesCommand) {
            if (command.totalCount) {
                await sendCommand(new LogEntryCountCommand(
                    this.config.get("loggingEnabled") ?? false,
                    0,
                    this.config.get("doorSensorEnabled") ?? false,
                    this.config.get("doorSensorLoggingEnabled") ?? false
                ));
            }

            // TODO: implement logging

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof EnableLoggingCommand) {
            this.config.set("loggingEnabled", command.enabled);
            this.config.save();

            // TODO: implement logging

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof SetHomeKitConfigurationCommand) {
            // TODO: implement

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof SetDoorSensorConfigurationCommand) {
            this.config.set("doorSensorEnabled", command.enabled);
            this.config.set("doorSensorUnlockedDoorOpenWarningTime", command.unlockedDoorOpenWarningTime);
            this.config.set("doorSensorUnlockedDoorOpenWarningEnable", command.unlockedDoorOpenWarningEnable);
            this.config.set("doorSensorLockedDoorOpenWarningEnabled", command.lockedDoorOpenWarningEnabled);
            this.config.set("doorSensorState", command.enabled ? DOOR_SENSOR_STATE_CLOSED : DOOR_SENSOR_STATE_DEACTIVATED);
            this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestDoorSensorCalibrationCommand) {
            switch (command.data) {
                case 1:
                case 2:
                    this.config.set("doorSensorState", DOOR_SENSOR_STATE_CALIBRATING);
                    this.config.set("doorSensorEnabled", false);
                    break;
                case 3:
                    this.config.set("doorSensorState", DOOR_SENSOR_STATE_CLOSED);
                    this.config.set("doorSensorEnabled", true);
                    break;
            }
            this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else if (command instanceof RequestDoorSensorConfigurationCommand) {
            return new DoorSensorConfigurationCommand(
                this.config.get("doorSensorEnabled") ?? false,
                this.config.get("doorSensorUnlockedDoorOpenWarningTime") ?? 30,
                this.config.get("doorSensorUnlockedDoorOpenWarningEnable") ?? false,
                this.config.get("doorSensorLockedDoorOpenWarningEnabled") ?? false
            );
        } else if (command instanceof EnableDoorSensorLoggingCommand) {
            this.config.set("doorSensorLoggingEnabled", command.enabled);
            this.config.save();

            return new StatusCommand(STATUS_COMPLETE);
        } else {
            return new ErrorCommand(ERROR_UNKNOWN, command.id, `bad command ${command.id}`);
        }
    }

    private buildStateCommand(): KeyturnerStatesCommand {
        const now = new Date();
        return new KeyturnerStatesCommand(
            this.config.getNukiState(),
            this.config.getLockState(),
            0, // bluetooth
            DateTime.fromDate(now),
            0,
            false,
            this.config.getSerial() & 0xff,
            0,
            0,
            0,
            0,
            this.config.get("doorSensorState") ?? DOOR_SENSOR_STATE_DEACTIVATED
        );
    }

    private async sleep(secs: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, secs * 1000);
        });
    }

}
