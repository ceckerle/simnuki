import {ERROR_UNKNOWN} from "./command/Constants";
import {encodeCommand} from "./command/Codec";
import {ErrorCommand} from "./command/ErrorCommand";

export class KeyturnerGeneralDataIoHandler {

    handleRequest = async (data: Buffer): Promise<Buffer> => {
        // TODO: implement
        console.log(`Unexpected command on keyturner general characteristic ${data.toString("hex")}`);
        return encodeCommand(new ErrorCommand(ERROR_UNKNOWN));
    }

}
