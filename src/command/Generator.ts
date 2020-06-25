import {readFileSync, writeFileSync} from "fs";

const DEFINITIONS = `
!RequestData,1
commandId,u,2
additionalData,B,0
!PublicKey,3
publicKey,B,32
!Challenge,4
nonce,B,32
!AuthorizationAuthenticator,5
authenticator,B,32
!AuthorizationData,6
authenticator,B,32
appType,u,1
appId,u,4
name,s,32
nonce,B,32
!AuthorizationId,7
authenticator,B,32
authorizationId,u,4
uuid,B,16
nonce,B,32
!AuthorizationIdConfirmation,1e
authenticator,B,32
authorizationId,u,4
!RemoveAuthorizationEntry,8,CommandNeedsSecurityPin
authorizationId,u,4
nonce,B,32
securityPin,u,2
!RequestAuthorizationEntries,9,CommandNeedsSecurityPin
offset,u,2
count,u,2
nonce,B,32
securityPin,u,2
!AuthorizationEntry,a
authorizationId,u,4
idType,u,1
name,s,32
enabled,u,1
remoteAllowed,u,1
dateCreated,D
dateLastActive,D
lockCount,u,2
timeLimited,u,1
allowedFromDate,D
allowedUntilDate,D
allowedWeekdays,u,1
allowedFromTime,u,2
allowedToTime,u,2
!AuthorizationDataInvite,b,CommandNeedsSecurityPin
name,s,32
idType,u,1
sharedKey,B,32
remoteAllowed,u,1
timeLimited,u,1
allowedFromDate,D
allowedUntilDate,D
allowedWeekdays,u,1
allowedFromTime,u,2
allowedToTime,u,2
nonce,B,32
securityPin,u,2
!AuthorizationIdInvite,1f
authorizationId,u,4
dateCreated,D
!UpdateAuthorizationEntry,25,CommandNeedsSecurityPin
authorizationId,u,4
name,s,32
enabled,u,1
remoteAllowed,u,1
timeLimited,u,1
allowedFromDate,D
allowedUntilDate,D
allowedWeekdays,u,1
allowedFromTime,u,2
allowedToTime,u,2
nonce,B,32
securityPin,u,2
!KeyturnerStates,c
nukState,u,1
lockState,u,1
trigger,u,1
currentTime,D
timezoneOffset,i,2
criticalBatteryState,u,1
configUpdateCount,u,1
lockngoTimer,u,1
lastLockAction,u,1
lastLockActionTrigger,u,1
lastLockActionCompletionState,u,1
doorSensorState,u,1
!LockAction,d,CommandNeedsChallenge
lockAction,u,1
appId,u,4
flags,u,1
nameSuffix,s,20
nonce,B,32
!Status,e
status,u,1
!MostRecentCommand,f
commandId,u,2
!OpeningsClosingsSummary,10
openingsTotal,u,2
closingsTotal,u,2
openingsSinceBoot,u,2
closingsSinceBoot,u,2
!BatteryReport,11
batteryDrain,u,2
batteryVoltage,u,2
criticalBatteryState,u,1
locakAction,u,1
startVoltage,u,2
lowestVoltage,u,2
lockDistance,u,2
startTemperature,i,1
maxTurnCurrent,u,2
batteryResistance,u,2
!Error,12
errorCode,u,1
commandId,u,2
!SetConfig,13,CommandNeedsSecurityPin
name,s,32
latitude,f,4
longitude,f,4
autoUnlatch,u,1
pairingEnabled,u,1
buttonEnabled,u,1
ledEnabled,u,1
ledBrightness,u,1
timezoneOffset,i,2
dstMode,u,1
fobAction1,u,1
fobAction2,u,1
fobAction3,u,1
singleLock,u,1
advertisingMode,u,1
timezoneId,u,2
nonce,B,32
securityPin,u,2
!RequestConfig,14,CommandNeedsChallenge
nonce,B,32
!Config,15
nukiId,u,4
name,s,32
latitude,f,4
longitude,f,4
autoUnlatch,u,1
pairingEnabled,u,1
buttonEnabled,u,1
ledEnabled,u,1
ledBrightness,u,1
currentTime,D
timezoneOffset,i,2
dstMode,u,1
hasFob,u,1
fobAction1,u,1
fobAction2,u,1
fobAction3,u,1
singleLock,u,1
advertisingMode,u,1
hasKeypad,u,1
firmwareVersion,U,3
hardwareRevision,u,2
homekitStatus,u,1
timezoneId,u,2
!SetSecurityPin,19,CommandNeedsSecurityPin
pin,u,2
nonce,B,32
securityPin,u,2
!VerifySecurityPin,20,CommandNeedsSecurityPin
nonce,B,32
securityPin,u,2
!RequestCalibration,1a,CommandNeedsSecurityPin
nonce,B,32
securityPin,u,2
!RequestReboot,1d,CommandNeedsSecurityPin
nonce,B,32
securityPin,u,2
!UpdateTime,21,CommandNeedsSecurityPin
time,D
nonce,B,32
securityPin,u,2
!AuthorizationEntryCount,27
count,u,2
!FirmwareStatus,29
version,U,3
data,B,5
!RequestLogEntries,31,CommandNeedsSecurityPin
startIndex,u,4
count,u,2
sortOrder,u,1
totalCount,u,1
nonce,B,32
securityPin,u,2
!LogEntry,32
index,u,4
timestamp,D
authorizationId,u,4
name,s,32
type,u,1
data,B,0
!LogEntryCount,33
loggingEnabled,u,1
count,u,2
doorSensorEnabled,u,1
doorSensorLoggingEnabled,u,1
!EnableLogging,34,CommandNeedsSecurityPin
enabled,u,1
nonce,B,32
securityPin,u,2
!SetAdvancedConfig,35,CommandNeedsSecurityPin
unlockedPositionOffsetDegrees,i,2
lockedPositionOffsetDegrees,i,2
singleLockedPositionOffsetDegrees,i,2
unlockedToLockedTransitionOffsetDegrees,i,2
lockngoTimeout,u,1
singleButtonPressAction,u,1
doubleButtonPressAction,u,1
detachedCylinder,u,1
batteryType,u,1
automaticBatteryTypeDetection,u,1
unlatchDuration,u,1
autoLockTimeout,u,2
autoUnlockDisabled,u,1
nightmodeEnabled,u,1
nightmodeStartTime,u,2
nightmodeEndTime,u,2
nightmodeAutoLockEnabled,u,1
nightmodeAutoUnlockDisabled,u,1
nightmodeImmediateLockOnStart,u,1
nonce,B,32
securityPin,u,2
!RequestAdvancedConfig,36,CommandNeedsChallenge
nonce,B,32
!AdvancedConfig,37
totalDegrees,u,2
unlockedPositionOffsetDegrees,i,2
lockedPositionOffsetDegrees,i,2
singleLockedPositionOffsetDegrees,i,2
unlockedToLockedTransitionOffsetDegrees,i,2
lockngoTimeout,u,1
singleButtonPressAction,u,1
doubleButtonPressAction,u,1
detachedCylinder,u,1
batteryType,u,1
automaticBatteryTypeDetection,u,1
unlatchDuration,u,1
autoLockTimeout,u,2
autoUnlockDisabled,u,1
nightmodeEnabled,u,1
nightmodeStartTime,u,2
nightmodeEndTime,u,2
nightmodeAutoLockEnabled,u,1
nightmodeAutoUnlockDisabled,u,1
nightmodeImmediateLockOnStart,u,1
!AddTimeControlEntry,39,CommandNeedsSecurityPin
weekdays,u,1
time,u,2
lockAction,u,1
nonce,B,32
securityPin,u,2
!TimeControlEntryId,3a
entryId,u,1
!RemoveTimeControlEntry,3b,CommandNeedsSecurityPin
entryId,u,1
nonce,B,32
securityPin,u,2
!RequestTimeControlEntries,3c,CommandNeedsSecurityPin
nonce,B,32
securityPin,u,2
!TimeControlEntryCount,3d
count,u,1
!TimeControlEntry,3e
entryId,u,1
enabled,u,1
weekdays,u,1
time,u,2
lockAction,u,1
!UpdateTimeControlEntry,3f,CommandNeedsSecurityPin
entryId,u,1
enabled,u,1
weekdays,u,1
time,u,2
lockAction,u,1
nonce,B,32
securityPin,u,2
!AddKeypadCode,41,CommandNeedsSecurityPin
code,u,4
name,s,20
timeLimited,u,1
allowedFromDate,D
allowedUntilDate,D
allowedWeekdays,u,1
allowedFromTime,u,2
allowedToTime,u,2
nonce,B,32
securityPin,u,2
!KeypadCodeId,42
codeId,u,2
dateCreated,D
!RequestKeypadCodes,43,CommandNeedsSecurityPin
offset,u,2
count,u,2
nonce,B,32
securityPin,u,2
!KeypadCodeCount,44
count,u,2
!KeypadCode,45
codeId,u,2
code,u,4
name,s,20
dateCreated,D
dateLastActive,D
lockCount,u,2
timeLimited,u,1
allowedFromDate,D
allowedUntilDate,D
allowedWeekdays,u,1
allowedFromTime,u,2
allowedToTime,u,2
!UpdateKeypadCode,46,CommandNeedsSecurityPin
codeId,u,2
code,u,4
name,s,20
timeLimited,u,1
allowedFromDate,D
allowedUntilDate,D
allowedWeekdays,u,1
allowedFromTime,u,2
allowedToTime,u,2
nonce,B,32
securityPin,u,2
!RemveKeypadCode,47,CommandNeedsSecurityPin
codeId,u,2
nonce,B,32
securityPin,u,2
!KeypadAction,48,CommandNeedsChallenge
source,u,1
code,u,4
action,u,1
nonce,B,32
!SimpleLockAction,100,CommandNeedsChallenge
lockAction,u,1
nonce,B,32
`;

const constants = `
ERROR_BAD_CRC,FD
ERROR_BAD_LENGTH,FE
ERROR_UNKNOWN,FF
P_ERROR_NOT_PAIRING,10
P_ERROR_BAD_AUTHENTICATOR,11
P_ERROR_BAD_PARAMETER,12
P_ERROR_MAX_USER,13
K_ERROR_NOT_AUTHORIZED,20
K_ERROR_BAD_PIN,21
K_ERROR_BAD_NONCE,22
K_ERROR_BAD_PARAMETER,23
K_ERROR_INVALID_AUTH_ID,24
K_ERROR_DISABLED,25
K_ERROR_REMOTE_NOT_ALLOWED,26
K_ERROR_TIME_NOT_ALLOWED,27
K_ERROR_TOO_MANY_PIN_ATTEMPTS,28
K_ERROR_TOO_MANY_ENTRIES,29
K_ERROR_CODE_ALREADY_EXISTS,2A
K_ERROR_CODE_INVALID,2B
K_ERROR_CODE_INVALID_TIMEOUT_1,2C
K_ERROR_CODE_INVALID_TIMEOUT_2,2D
K_ERROR_CODE_INVALID_TIMEOUT_3,2E
K_ERROR_AUTO_UNLOCK_TOO_RECENT,40
K_ERROR_POSITION_UNKNOWN,41
K_ERROR_MOTOR_BLOCKED,42
K_ERROR_CLUTCH_FAILURE,43
K_ERROR_MOTOR_TIMEOUT,44
K_ERROR_BUSY,45
K_ERROR_CANCELED,46
K_ERROR_NOT_CALIBRATED,47
K_ERROR_MOTOR_POSITION_LIMIT,48
K_ERROR_MOTOR_LOW_VOLTAGE,49
K_ERROR_MOTOR_POWER_FAILURE,4A
K_ERROR_CLUTCH_POWER_FAILURE,4B
K_ERROR_VOLTAGE_TOO_LOW,4C
K_ERROR_FIRMWARE_UPDATE_NEEDED,4D
STATUS_COMPLETE,0
STATUS_ACCEPTED,1
`;

function buildCommands() {
    const commands = DEFINITIONS.trim().split("!").map((m) => m.trim().split("\n").map((l) => l.split(","))).slice(1);
    let consts = "";
    const constClassPairs: [string, string][] = [];

    for (const command of commands) {
        const name = `${command[0][0]}Command`;
        const constName = `CMD_${camelCase(command[0][0])}`;
        const id = parseInt(command[0][1], 16);
        const superClass = command[0].length > 2 ? command[0][2] : "Command";
        const props = command.slice(1).map(getPropInfo);
        const totalBytes = props.filter((p) => !isNaN(p.bytes)).reduce((sum, p) => sum + p.bytes, 0);

        consts += `export const ${constName} = 0x${id.toString(16).padStart(2, "0")};\n`;
        constClassPairs.push([constName, name]);

        const c = `export class ${name} extends ${superClass} {
    
    readonly id = ${constName};
${props.map((p) => 
`    ${p.name}: ${p.type};`).join("\n")}

    constructor(${props.map((p) => `${p.name}?: ${p.type}`).join(", ")}) {
        super();
${props.map((p) => 
`        this.${p.name} = ${p.name} ?? ${p.init};`).join("\n")}
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== ${totalBytes}) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        ${props.length > 1 ? "let" : "const"} ofs = 0;
${props.map((p, i) => 
`        this.${p.name} = ${p.dec};` + (i < props.length - 1 ? `
        ofs += ${p.bytes};` : "")).join("\n")}
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(${totalBytes});
        ${props.length > 1 ? "let" : "const"} ofs = 0;
${props.map((p, i) =>
`        ${p.enc};` + (i < props.length - 1 ? `
        ofs += ${p.bytes};` : "")).join("\n")}
        return buffer;
    }
    
    toString(): string {
        let str = "${name} {";
${props.map((p) => 
`        str += "\\n  ${p.name}: " + ${p.str};`).join("\n")}
        str += "\\n}";
        return str;
    }
    
}
`;

        const utilFunctions: string[] = [];
        readFileSync("src/command/Util.ts").toString("utf-8")
            .replace(/export function (\w+)/g, (substring, fn) => {
            utilFunctions.push(fn);
            return substring;
        });
        const usedUtilFunctions: string[] = [];
        for (const fn of utilFunctions) {
            if (c.indexOf(`${fn}(`) !== -1) {
                usedUtilFunctions.push(fn);
            }
        }
        const imports: {[module: string]: string[]} = {
            [`./${superClass}`]: [superClass],
            "./Constants": [constName, "ERROR_BAD_LENGTH"],
            "./DecodingError": ["DecodingError"],
            "./Util": usedUtilFunctions
        };
        const importStr = Object.getOwnPropertyNames(imports)
            .map((m) => [m, imports[m]] as [string, string[]])
            .filter((t) => t[1].length > 0)
            .map((t) => `import {${t[1].join(", ")}} from "${t[0]}";`).join("\n");

        writeFileSync(`src/command/${name}.ts`, `${importStr}\n\n${c}`);
    }

    consts += constants.trim().split("\n").map((l) => l.split(",")).map((l) => `\nexport const ${l[0]} = 0x${parseInt(l[1], 16).toString(16).padStart(2, "0")};`).join("")

    writeFileSync("src/command/Constants.ts", consts);

    const codec =
`import {Command} from "./Command";
import {DecodingError} from "./DecodingError";
import {checkCrc, setCrc} from "./Util";
import {${constClassPairs.map((p) => p[0]).join(", ")}, ERROR_BAD_LENGTH, ERROR_BAD_CRC, ERROR_UNKNOWN} from "./Constants";
${constClassPairs.map((p) => `import {${p[1]}} from "./${p[1]}"`).join("\n")}


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
${constClassPairs.map((p) => 
`        case ${p[0]}:
            command = new ${p[1]}();
            break;`).join("\n")}        
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
`;
    writeFileSync("src/command/Codec.ts", codec);

}

function camelCase(str: string) {
    let cc = "";
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (i > 0 && isUpperCase(c)) {
            cc += "_";
        }
        cc += c;
    }
    return cc.toUpperCase();
}

function isUpperCase(str: string) {
    return str === str.toUpperCase();
}

function getPropInfo(prop: string[]) {
    const name = prop[0];
    const t = prop[1];
    let bytes = prop.length > 1 ? parseInt(prop[2], 10) : 0;
    let type: string;
    let init: string;
    let dec: string;
    let enc: string;
    let str = `this.${name}`;
    switch (t) {
        case "B":
            type = "Buffer";
            init = `Buffer.alloc(${bytes})`;
            dec = `buffer.slice(ofs, ofs + ${bytes})`;
            enc = `this.${name}.copy(buffer, ofs)`;
            str = `"0x" + this.${name}.toString("hex")`
            break;
        case "s":
            type = "string";
            init = `""`;
            dec = `readString(buffer, ofs, ${bytes})`;
            enc = `writeString(buffer, this.${name}, ofs, ${bytes})`;
            break;
        case "u":
        case "U":
        case "i":
            type = "number";
            init = "0";
            switch (bytes) {
                case 1:
                case 2:
                case 4:
                    dec = `buffer.read${t.toLocaleLowerCase() === "u" ? "U" : ""}Int${bytes * 8}${bytes === 1 ? "" : (isUpperCase(t) ? "BE" : "LE")}(ofs)`;
                    enc = `buffer.write${t.toLocaleLowerCase() === "u" ? "U" : ""}Int${bytes * 8}${bytes === 1 ? "" : (isUpperCase(t) ? "BE" : "LE")}(this.${name}, ofs)`;
                    break;
                case 3:
                    dec = `read${t.toLocaleLowerCase() === "u" ? "U" : ""}Int${bytes * 8}${isUpperCase(t) ? "BE" : "LE"}(buffer, ofs)`;
                    enc = `write${t.toLocaleLowerCase() === "u" ? "U" : ""}Int${bytes * 8}${isUpperCase(t) ? "BE" : "LE"}(buffer, this.${name}, ofs)`;
                    break;
                default:
                    throw new Error("Unsupported bytes for type int " + bytes);
            }
            str = `"0x" + this.${name}.toString(16).padStart(${bytes * 2}, "0")`;
            break;
        case "f":
            type = "number";
            init = "0"
            switch (bytes) {
                case 4:
                    dec = `buffer.readFloatLE(ofs)`;
                    enc = `buffer.writeFloatLE(this.${name}, ofs)`;
                    break;
                default:
                    throw new Error("Unsupported bytes for type float " + bytes);
            }
            break;
        case "D":
            bytes = 7;
            type = "Date";
            init = "new Date()";
            dec = `readDateTime(buffer, ofs)`;
            enc = `writeDateTime(buffer, this.${name}, ofs)`;
            str = `this.${name}.toISOString()`;
            break;
        default:
            throw new Error("Unsupported type " + prop[1]);
    }

    return {
        name,
        type,
        bytes,
        init,
        dec,
        enc,
        str
    }
}

buildCommands();
