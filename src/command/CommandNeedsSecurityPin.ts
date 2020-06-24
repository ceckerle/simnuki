import {CommandNeedsChallenge} from "./CommandNeedsChallenge";

export abstract class CommandNeedsSecurityPin extends CommandNeedsChallenge {

    abstract securityPin: number;

}