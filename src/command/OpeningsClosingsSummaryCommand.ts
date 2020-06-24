import {Command} from "./Command";
import {CMD_OPENINGS_CLOSINGS_SUMMARY, ERROR_BAD_LENGTH} from "./Constants";
import {DecodingError} from "./DecodingError";

export class OpeningsClosingsSummaryCommand extends Command {
    
    readonly id = CMD_OPENINGS_CLOSINGS_SUMMARY;
    openingsTotal: number;
    closingsTotal: number;
    openingsSinceBoot: number;
    closingsSinceBoot: number;

    constructor(openingsTotal?: number, closingsTotal?: number, openingsSinceBoot?: number, closingsSinceBoot?: number) {
        super();
        this.openingsTotal = openingsTotal ?? 0;
        this.closingsTotal = closingsTotal ?? 0;
        this.openingsSinceBoot = openingsSinceBoot ?? 0;
        this.closingsSinceBoot = closingsSinceBoot ?? 0;
    }
    
    decode(buffer: Buffer): void {
        if (buffer.length !== 8) {
            throw new DecodingError(ERROR_BAD_LENGTH);
        }
        let ofs = 0;
        this.openingsTotal = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.closingsTotal = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.openingsSinceBoot = buffer.readUInt16LE(ofs);
        ofs += 2;
        this.closingsSinceBoot = buffer.readUInt16LE(ofs);
    }

    encode(): Buffer {
        const buffer = Buffer.alloc(8);
        let ofs = 0;
        buffer.writeUInt16LE(this.openingsTotal, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.closingsTotal, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.openingsSinceBoot, ofs);
        ofs += 2;
        buffer.writeUInt16LE(this.closingsSinceBoot, ofs);
        return buffer;
    }
    
    toString(): string {
        let str = "OpeningsClosingsSummaryCommand {";
        str += "\n  openingsTotal: " + "0x" + this.openingsTotal.toString(16).padStart(4, "0");
        str += "\n  closingsTotal: " + "0x" + this.closingsTotal.toString(16).padStart(4, "0");
        str += "\n  openingsSinceBoot: " + "0x" + this.openingsSinceBoot.toString(16).padStart(4, "0");
        str += "\n  closingsSinceBoot: " + "0x" + this.closingsSinceBoot.toString(16).padStart(4, "0");
        str += "\n}";
        return str;
    }
    
}
