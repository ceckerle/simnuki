export class DateTime {

    constructor(public year: number, public month: number, public day: number,
                public hours: number, public minutes: number, public seconds: number) {
    }

    toString(): string {
        return `${this.year}-${this.month.toString().padStart(2, "0")}-${this.day.toString().padStart(2, "0")}T${this.hours.toString().padStart(2, "0")}:${this.minutes.toString().padStart(2, "0")}:${this.seconds.toString().padStart(2, "0")}`;
    }

    static fromDate(date: Date): DateTime {
        return new DateTime(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    }

    toDate(): Date {
        return new Date(this.year, this.month - 1, this.day, this.hours, this.minutes, this.seconds);
    }

    static decode(buffer: Buffer, offset: number): DateTime {
        const year = buffer.readUInt16LE(offset);
        offset += 2;
        const month = buffer.readUInt8(offset++);
        const day = buffer.readUInt8(offset++);
        const hours = buffer.readUInt8(offset++);
        const minutes = buffer.readUInt8(offset++);
        const seconds = buffer.readUInt8(offset++);
        return new DateTime(year, month, day, hours, minutes, seconds);
    }

    encode(buffer: Buffer, offset: number): void {
        buffer.writeUInt16LE(this.year, offset);
        offset += 2;
        buffer.writeUInt8(this.month, offset++);
        buffer.writeUInt8(this.day, offset++);
        buffer.writeUInt8(this.hours, offset++);
        buffer.writeUInt8(this.minutes, offset++);
        buffer.writeUInt8(this.seconds, offset++);
    }

}
