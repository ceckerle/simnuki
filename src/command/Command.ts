export abstract class Command {

    id = 0;

    abstract decode(buffer: Buffer): void;

    abstract encode(): Buffer;

    abstract toString(): string;

}
