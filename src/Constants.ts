import {crc16ccitt} from "crc";

// Nuki protocol constants

export const INITIALIZATION_SERVICE_UUID = "a92ee000-5501-11e4-916c-0800200c9a66";
export const PAIRING_SERVICE_UUID = "a92ee100-5501-11e4-916c-0800200c9a66";
export const PAIRING_GDIO_CHARACTERISTIC_UUID = "a92ee101-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_SERVICE_UUID = "a92ee200-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_GDIO_CHARACTERISTIC_UUID = "a92ee201-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_USDIO_CHARACTERISTIC_UUID = "a92ee202-5501-11e4-916c-0800200c9a66";

export const CMD_REQUEST_DATA = 0x01;
export const CMD_ID_PUBLIC_KEY = 0x03;
export const CMD_CHALLENGE = 0x04;
export const CMD_AUTHORIZATION_AUTHENTICATOR = 0x05;
export const CMD_AUTHORIZATION_DATA = 0x06;
export const CMD_AUTHORIZATION_ID = 0x07;
export const CMD_AUTHORIZATION_ID_CONFIRMATION = 0x1E;
export const CMD_REMOVE_AUTHORIZATION_ENTRY = 0x08;
export const CMD_AUTHORIZATION_DATA_INVITE = 0x0B;
export const CMD_NUKI_STATES = 0x0C;
export const CMD_LOCK_ACTION = 0x0D;
export const CMD_STATUS = 0x0E;
export const CMD_ERROR = 0x12;
export const CMD_SET_CONFIG = 0x13;
export const CMD_REQUEST_CONFIG = 0x14;
export const CMD_CONFIG = 0x15;
export const CMD_REQUEST_CALIBRATION = 0x1A;
export const CMD_SET_PIN = 0x19;
export const CMD_VERIFY_PIN = 0x20;
export const CMD_UPDATE_TIME = 0x21;
export const CMD_SET_ADVANCED_CONFIG = 0x35;
export const CMD_REQUEST_ADVANCED_CONFIG = 0x36;
export const CMD_ADVANCED_CONFIG = 0x37;


export const STATUS_COMPLETE = 0x00;
export const STATUS_ACCEPTED = 0x01;

export const K_ERROR_BAD_PIN = 0x21;
export const K_ERROR_BAD_NONCE = 0x22;
export const K_ERROR_BAD_PARAMETER = 0x23;

export const ERROR_BAD_CRC = 0xFD;
export const ERROR_BAD_LENGTH = 0xFE;
export const ERROR_UNKNOWN = 0xFF;

export const P_ERROR_NOT_PAIRING = 0x10;
export const P_ERROR_BAD_AUTHENTICATOR = 0x11;
export const P_ERROR_BAD_PARAMETER = 0x12;
export const P_ERROR_MAX_USER = 0x13;

export const NUKI_NONCEBYTES = 32;

export const NUKI_STATE_UNINITIALIZED = 0x00;
export const NUKI_STATE_PAIRING_MODE = 0x01;
export const NUKI_STATE_DOOR_MODE = 0x02;
export const NUKI_STATE_MAINTENANCE_MODE = 0x04;

export const LOCK_STATE_UNCALIBRATED = 0x00;
export const LOCK_STATE_LOCKED = 0x01;
export const LOCK_STATE_UNLOCKING = 0x02;
export const LOCK_STATE_UNLOCKED = 0x03;
export const LOCK_STATE_LOCKING = 0x04;
export const LOCK_STATE_UNLATCHED = 0x05;
export const LOCK_STATE_UNLOCKED_LOCKNGO = 0x06;
export const LOCK_STATE_UNLATCHING = 0x07;
export const LOCK_STATE_CALIBRATION = 0xFC;
export const LOCK_STATE_BOOT_RUN = 0xFD;
export const LOCK_STATE_MOTOR_BLOCKED = 0xFE;
export const LOCK_STATE_UNDEFINED = 0xFF;

export const FOB_ACTION_NONE = 0x00;
export const FOB_ACTION_UNLOCK = 0x01;
export const FOB_ACTION_LOCK = 0x02;
export const FOB_ACTION_LOCKNGO = 0x03;
export const FOB_ACTION_INTELLIGENT = 0x04;

export const LOCK_ACTION_UNLOCK = 0x01;
export const LOCK_ACTION_LOCK = 0x02;
export const LOCK_ACTION_UNLATCH = 0x03;
export const LOCK_ACTION_LOCKNGO = 0x04;
export const LOCK_ACTION_LOCKNGO_WITH_UNLATCH = 0x05;
export const LOCK_ACTION_FULL_LOCK = 0x06;
export const LOCK_ACTION_FOB_ACTION_1 = 0x81;
export const LOCK_ACTION_FOB_ACTION_2 = 0x82;
export const LOCK_ACTION_FOB_ACTION_3 = 0x83;

export function crcOk(dataTocheck: Buffer): boolean {
    const dataForCrc = dataTocheck.slice(0, dataTocheck.length - 2);
    const crcSumCalc = crc16ccitt(dataForCrc);
    const crcSumRetrieved = dataTocheck.readUInt16LE(dataTocheck.length - 2);
    return crcSumCalc === crcSumRetrieved;
}

