import {Command} from "./Command";
import {DecodingError} from "./DecodingError";
import {checkCrc, setCrc} from "./Util";
import {CMD_REQUEST_DATA, CMD_PUBLIC_KEY, CMD_CHALLENGE, CMD_AUTHORIZATION_AUTHENTICATOR, CMD_AUTHORIZATION_DATA, CMD_AUTHORIZATION_ID, CMD_AUTHORIZATION_ID_CONFIRMATION, CMD_REMOVE_AUTHORIZATION_ENTRY, CMD_REQUEST_AUTHORIZATION_ENTRIES, CMD_AUTHORIZATION_ENTRY, CMD_AUTHORIZATION_DATA_INVITE, CMD_AUTHORIZATION_ID_INVITE, CMD_UPDATE_AUTHORIZATION_ENTRY, CMD_KEYTURNER_STATES, CMD_LOCK_ACTION, CMD_STATUS, CMD_MOST_RECENT_COMMAND, CMD_OPENINGS_CLOSINGS_SUMMARY, CMD_BATTERY_REPORT, CMD_ERROR, CMD_SET_CONFIG, CMD_REQUEST_CONFIG, CMD_CONFIG, CMD_SET_SECURITY_PIN, CMD_VERIFY_SECURITY_PIN, CMD_REQUEST_CALIBRATION, CMD_REQUEST_REBOOT, CMD_UPDATE_TIME, CMD_AUTHORIZATION_ENTRY_COUNT, CMD_FIRMWARE_STATUS, CMD_REQUEST_LOG_ENTRIES, CMD_LOG_ENTRY, CMD_LOG_ENTRY_COUNT, CMD_ENABLE_LOGGING, CMD_SET_ADVANCED_CONFIG, CMD_REQUEST_ADVANCED_CONFIG, CMD_ADVANCED_CONFIG, CMD_ADD_TIME_CONTROL_ENTRY, CMD_TIME_CONTROL_ENTRY_ID, CMD_REMOVE_TIME_CONTROL_ENTRY, CMD_REQUEST_TIME_CONTROL_ENTRIES, CMD_TIME_CONTROL_ENTRY_COUNT, CMD_TIME_CONTROL_ENTRY, CMD_UPDATE_TIME_CONTROL_ENTRY, CMD_ADD_KEYPAD_CODE, CMD_KEYPAD_CODE_ID, CMD_REQUEST_KEYPAD_CODES, CMD_KEYPAD_CODE_COUNT, CMD_KEYPAD_CODE, CMD_UPDATE_KEYPAD_CODE, CMD_REMVE_KEYPAD_CODE, CMD_KEYPAD_ACTION, CMD_SET_HOME_KIT_CONFIGURATION, CMD_REQUEST_DOOR_SENSOR_CALIBRATION, CMD_SET_DOOR_SENSOR_CONFIGURATION, CMD_REQUEST_DOOR_SENSOR_CONFIGURATION, CMD_DOOR_SENSOR_CONFIGURATION, CMD_ENABLE_DOOR_SENSOR_LOGGING, CMD_SIMPLE_LOCK_ACTION, ERROR_BAD_LENGTH, ERROR_BAD_CRC, ERROR_UNKNOWN} from "./Constants";
import {RequestDataCommand} from "./RequestDataCommand"
import {PublicKeyCommand} from "./PublicKeyCommand"
import {ChallengeCommand} from "./ChallengeCommand"
import {AuthorizationAuthenticatorCommand} from "./AuthorizationAuthenticatorCommand"
import {AuthorizationDataCommand} from "./AuthorizationDataCommand"
import {AuthorizationIdCommand} from "./AuthorizationIdCommand"
import {AuthorizationIdConfirmationCommand} from "./AuthorizationIdConfirmationCommand"
import {RemoveAuthorizationEntryCommand} from "./RemoveAuthorizationEntryCommand"
import {RequestAuthorizationEntriesCommand} from "./RequestAuthorizationEntriesCommand"
import {AuthorizationEntryCommand} from "./AuthorizationEntryCommand"
import {AuthorizationDataInviteCommand} from "./AuthorizationDataInviteCommand"
import {AuthorizationIdInviteCommand} from "./AuthorizationIdInviteCommand"
import {UpdateAuthorizationEntryCommand} from "./UpdateAuthorizationEntryCommand"
import {KeyturnerStatesCommand} from "./KeyturnerStatesCommand"
import {LockActionCommand} from "./LockActionCommand"
import {StatusCommand} from "./StatusCommand"
import {MostRecentCommandCommand} from "./MostRecentCommandCommand"
import {OpeningsClosingsSummaryCommand} from "./OpeningsClosingsSummaryCommand"
import {BatteryReportCommand} from "./BatteryReportCommand"
import {ErrorCommand} from "./ErrorCommand"
import {SetConfigCommand} from "./SetConfigCommand"
import {RequestConfigCommand} from "./RequestConfigCommand"
import {ConfigCommand} from "./ConfigCommand"
import {SetSecurityPinCommand} from "./SetSecurityPinCommand"
import {VerifySecurityPinCommand} from "./VerifySecurityPinCommand"
import {RequestCalibrationCommand} from "./RequestCalibrationCommand"
import {RequestRebootCommand} from "./RequestRebootCommand"
import {UpdateTimeCommand} from "./UpdateTimeCommand"
import {AuthorizationEntryCountCommand} from "./AuthorizationEntryCountCommand"
import {FirmwareStatusCommand} from "./FirmwareStatusCommand"
import {RequestLogEntriesCommand} from "./RequestLogEntriesCommand"
import {LogEntryCommand} from "./LogEntryCommand"
import {LogEntryCountCommand} from "./LogEntryCountCommand"
import {EnableLoggingCommand} from "./EnableLoggingCommand"
import {SetAdvancedConfigCommand} from "./SetAdvancedConfigCommand"
import {RequestAdvancedConfigCommand} from "./RequestAdvancedConfigCommand"
import {AdvancedConfigCommand} from "./AdvancedConfigCommand"
import {AddTimeControlEntryCommand} from "./AddTimeControlEntryCommand"
import {TimeControlEntryIdCommand} from "./TimeControlEntryIdCommand"
import {RemoveTimeControlEntryCommand} from "./RemoveTimeControlEntryCommand"
import {RequestTimeControlEntriesCommand} from "./RequestTimeControlEntriesCommand"
import {TimeControlEntryCountCommand} from "./TimeControlEntryCountCommand"
import {TimeControlEntryCommand} from "./TimeControlEntryCommand"
import {UpdateTimeControlEntryCommand} from "./UpdateTimeControlEntryCommand"
import {AddKeypadCodeCommand} from "./AddKeypadCodeCommand"
import {KeypadCodeIdCommand} from "./KeypadCodeIdCommand"
import {RequestKeypadCodesCommand} from "./RequestKeypadCodesCommand"
import {KeypadCodeCountCommand} from "./KeypadCodeCountCommand"
import {KeypadCodeCommand} from "./KeypadCodeCommand"
import {UpdateKeypadCodeCommand} from "./UpdateKeypadCodeCommand"
import {RemveKeypadCodeCommand} from "./RemveKeypadCodeCommand"
import {KeypadActionCommand} from "./KeypadActionCommand"
import {SetHomeKitConfigurationCommand} from "./SetHomeKitConfigurationCommand"
import {RequestDoorSensorCalibrationCommand} from "./RequestDoorSensorCalibrationCommand"
import {SetDoorSensorConfigurationCommand} from "./SetDoorSensorConfigurationCommand"
import {RequestDoorSensorConfigurationCommand} from "./RequestDoorSensorConfigurationCommand"
import {DoorSensorConfigurationCommand} from "./DoorSensorConfigurationCommand"
import {EnableDoorSensorLoggingCommand} from "./EnableDoorSensorLoggingCommand"
import {SimpleLockActionCommand} from "./SimpleLockActionCommand"


export function decodeCommand(buffer: Buffer, skipCrc = false): Command {
    if (buffer.length < 4) {
        throw new DecodingError(ERROR_BAD_LENGTH);
    }
    if (!skipCrc && !checkCrc(buffer)) {
        throw new DecodingError(ERROR_BAD_CRC);
    }
    const id = buffer.readUInt16LE(0);
    let command;
    switch (id) {
        case CMD_REQUEST_DATA:
            command = new RequestDataCommand();
            break;
        case CMD_PUBLIC_KEY:
            command = new PublicKeyCommand();
            break;
        case CMD_CHALLENGE:
            command = new ChallengeCommand();
            break;
        case CMD_AUTHORIZATION_AUTHENTICATOR:
            command = new AuthorizationAuthenticatorCommand();
            break;
        case CMD_AUTHORIZATION_DATA:
            command = new AuthorizationDataCommand();
            break;
        case CMD_AUTHORIZATION_ID:
            command = new AuthorizationIdCommand();
            break;
        case CMD_AUTHORIZATION_ID_CONFIRMATION:
            command = new AuthorizationIdConfirmationCommand();
            break;
        case CMD_REMOVE_AUTHORIZATION_ENTRY:
            command = new RemoveAuthorizationEntryCommand();
            break;
        case CMD_REQUEST_AUTHORIZATION_ENTRIES:
            command = new RequestAuthorizationEntriesCommand();
            break;
        case CMD_AUTHORIZATION_ENTRY:
            command = new AuthorizationEntryCommand();
            break;
        case CMD_AUTHORIZATION_DATA_INVITE:
            command = new AuthorizationDataInviteCommand();
            break;
        case CMD_AUTHORIZATION_ID_INVITE:
            command = new AuthorizationIdInviteCommand();
            break;
        case CMD_UPDATE_AUTHORIZATION_ENTRY:
            command = new UpdateAuthorizationEntryCommand();
            break;
        case CMD_KEYTURNER_STATES:
            command = new KeyturnerStatesCommand();
            break;
        case CMD_LOCK_ACTION:
            command = new LockActionCommand();
            break;
        case CMD_STATUS:
            command = new StatusCommand();
            break;
        case CMD_MOST_RECENT_COMMAND:
            command = new MostRecentCommandCommand();
            break;
        case CMD_OPENINGS_CLOSINGS_SUMMARY:
            command = new OpeningsClosingsSummaryCommand();
            break;
        case CMD_BATTERY_REPORT:
            command = new BatteryReportCommand();
            break;
        case CMD_ERROR:
            command = new ErrorCommand();
            break;
        case CMD_SET_CONFIG:
            command = new SetConfigCommand();
            break;
        case CMD_REQUEST_CONFIG:
            command = new RequestConfigCommand();
            break;
        case CMD_CONFIG:
            command = new ConfigCommand();
            break;
        case CMD_SET_SECURITY_PIN:
            command = new SetSecurityPinCommand();
            break;
        case CMD_VERIFY_SECURITY_PIN:
            command = new VerifySecurityPinCommand();
            break;
        case CMD_REQUEST_CALIBRATION:
            command = new RequestCalibrationCommand();
            break;
        case CMD_REQUEST_REBOOT:
            command = new RequestRebootCommand();
            break;
        case CMD_UPDATE_TIME:
            command = new UpdateTimeCommand();
            break;
        case CMD_AUTHORIZATION_ENTRY_COUNT:
            command = new AuthorizationEntryCountCommand();
            break;
        case CMD_FIRMWARE_STATUS:
            command = new FirmwareStatusCommand();
            break;
        case CMD_REQUEST_LOG_ENTRIES:
            command = new RequestLogEntriesCommand();
            break;
        case CMD_LOG_ENTRY:
            command = new LogEntryCommand();
            break;
        case CMD_LOG_ENTRY_COUNT:
            command = new LogEntryCountCommand();
            break;
        case CMD_ENABLE_LOGGING:
            command = new EnableLoggingCommand();
            break;
        case CMD_SET_ADVANCED_CONFIG:
            command = new SetAdvancedConfigCommand();
            break;
        case CMD_REQUEST_ADVANCED_CONFIG:
            command = new RequestAdvancedConfigCommand();
            break;
        case CMD_ADVANCED_CONFIG:
            command = new AdvancedConfigCommand();
            break;
        case CMD_ADD_TIME_CONTROL_ENTRY:
            command = new AddTimeControlEntryCommand();
            break;
        case CMD_TIME_CONTROL_ENTRY_ID:
            command = new TimeControlEntryIdCommand();
            break;
        case CMD_REMOVE_TIME_CONTROL_ENTRY:
            command = new RemoveTimeControlEntryCommand();
            break;
        case CMD_REQUEST_TIME_CONTROL_ENTRIES:
            command = new RequestTimeControlEntriesCommand();
            break;
        case CMD_TIME_CONTROL_ENTRY_COUNT:
            command = new TimeControlEntryCountCommand();
            break;
        case CMD_TIME_CONTROL_ENTRY:
            command = new TimeControlEntryCommand();
            break;
        case CMD_UPDATE_TIME_CONTROL_ENTRY:
            command = new UpdateTimeControlEntryCommand();
            break;
        case CMD_ADD_KEYPAD_CODE:
            command = new AddKeypadCodeCommand();
            break;
        case CMD_KEYPAD_CODE_ID:
            command = new KeypadCodeIdCommand();
            break;
        case CMD_REQUEST_KEYPAD_CODES:
            command = new RequestKeypadCodesCommand();
            break;
        case CMD_KEYPAD_CODE_COUNT:
            command = new KeypadCodeCountCommand();
            break;
        case CMD_KEYPAD_CODE:
            command = new KeypadCodeCommand();
            break;
        case CMD_UPDATE_KEYPAD_CODE:
            command = new UpdateKeypadCodeCommand();
            break;
        case CMD_REMVE_KEYPAD_CODE:
            command = new RemveKeypadCodeCommand();
            break;
        case CMD_KEYPAD_ACTION:
            command = new KeypadActionCommand();
            break;
        case CMD_SET_HOME_KIT_CONFIGURATION:
            command = new SetHomeKitConfigurationCommand();
            break;
        case CMD_REQUEST_DOOR_SENSOR_CALIBRATION:
            command = new RequestDoorSensorCalibrationCommand();
            break;
        case CMD_SET_DOOR_SENSOR_CONFIGURATION:
            command = new SetDoorSensorConfigurationCommand();
            break;
        case CMD_REQUEST_DOOR_SENSOR_CONFIGURATION:
            command = new RequestDoorSensorConfigurationCommand();
            break;
        case CMD_DOOR_SENSOR_CONFIGURATION:
            command = new DoorSensorConfigurationCommand();
            break;
        case CMD_ENABLE_DOOR_SENSOR_LOGGING:
            command = new EnableDoorSensorLoggingCommand();
            break;
        case CMD_SIMPLE_LOCK_ACTION:
            command = new SimpleLockActionCommand();
            break;        
        default:
            throw new DecodingError(ERROR_UNKNOWN, id);
    }
    command.decode(buffer.slice(2, buffer.length - 2));
    return command;
}

export function encodeCommand(command: Command): Buffer {
    const payload = command.encode();
    const buffer = Buffer.alloc(payload.length + 4);
    buffer.writeUInt16LE(command.id, 0);
    payload.copy(buffer, 2);
    setCrc(buffer);
    return buffer;
}
