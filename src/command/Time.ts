export class Time {

    constructor(public hours: number, public minutes: number) {
    }

    toString(): string {
        return `${this.hours.toString().padStart(2, "0")}:${this.minutes.toString().padStart(2, "0")}`;
    }

    static decode(buffer: Buffer, offset: number): Time {
        const hours = buffer.readUInt8(offset++);
        const minutes = buffer.readUInt8(offset++);
        return new Time(hours, minutes);
    }

    encode(buffer: Buffer, offset: number): void {
        buffer.writeUInt8(this.hours, offset++);
        buffer.writeUInt8(this.minutes, offset++);
    }

}
