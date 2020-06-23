export class DecodingError extends Error {

    constructor(public readonly code: number, public readonly commandId?: number, message?: string) {
        super(message);
    }

}
