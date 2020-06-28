import {crc16ccitt} from "crc";

export function checkCrc(data: Buffer): boolean {
    const dataForCrc = data.slice(0, data.length - 2);
    const crcSumCalc = crc16ccitt(dataForCrc);
    const crcSumRetrieved = data.readUInt16LE(data.length - 2);
    return crcSumCalc === crcSumRetrieved;
}

export function setCrc(data: Buffer): void {
    const dataForCrc = data.slice(0, data.length - 2);
    const crc = crc16ccitt(dataForCrc);
    data.writeUInt16LE(crc, data.length - 2);
}

export function readString(data: Buffer, offset = 0, length?: number): string {
    length = length ?? (data.length - offset);
    const str = data.toString("utf-8", offset, offset + length);
    const idx = str.indexOf("\0");
    return idx > -1 ? str.substring(0, idx) : str;
}

export function writeString(data: Buffer, str: string, offset = 0, length?: number): void {
    length = length ?? (data.length - offset);
    data.fill(0, offset, offset + length);
    let ofs = offset;
    for (let i = 0; i < str.length; i++) {
        const bytes = Buffer.from(str.charAt(i), "utf-8");
        if (offset + length - ofs < bytes.length) {
            break;
        }
        bytes.copy(data, ofs);
        ofs += bytes.length;
    }
}

export function readUInt24BE(buffer: Buffer, offset: number): number {
    return (buffer.readUInt8(offset++) << 16) + buffer.readUInt16BE(offset);
}

export function writeUInt24BE(buffer: Buffer, value: number, offset: number): void {
    buffer.writeUInt8(value >> 16 & 0xff, offset++);
    buffer.writeUInt16BE(value & 0xffff, offset);
}
