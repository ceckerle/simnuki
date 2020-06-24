export const INITIALIZATION_SERVICE_UUID = "a92ee000-5501-11e4-916c-0800200c9a66";
export const PAIRING_SERVICE_UUID = "a92ee100-5501-11e4-916c-0800200c9a66";
export const PAIRING_GDIO_CHARACTERISTIC_UUID = "a92ee101-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_SERVICE_UUID = "a92ee200-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_GDIO_CHARACTERISTIC_UUID = "a92ee201-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_USDIO_CHARACTERISTIC_UUID = "a92ee202-5501-11e4-916c-0800200c9a66";
export const KEYTURNER_THRID_CHARACTERISTIC_UUID = "a92ee203-5501-11e4-916c-0800200c9a66";

export const FIRMWARE_VERSION = 0x020000;
export const HARDWARE_VERSION = 0x0200;

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