import {Command} from "./Command";

export abstract class CommandNeedsChallenge extends Command {

    abstract nonce: Buffer;

}
