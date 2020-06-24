import {readDateTime, readString, writeDateTime, writeString} from "./Util";

test("writeString and readString", () => {
    let target = new Buffer("01234567890abcdef01234567890abcdef", "hex")
    writeString(target, "Hello", 4, 4);
    expect(target.toString("hex")).toBe("0123456748656c6cf01234567890abcdef");
    expect(readString(target, 4, 4)).toBe("Hell");
    target = new Buffer("01234567890abcdef01234567890abcdef", "hex")
    writeString(target, "Hello", 4);
    expect(target.toString("hex")).toBe("0123456748656c6c6f0000000000000000");
    expect(readString(target, 4 )).toBe("Hello");
});

test("writeTime and readTime", () => {
    const date = new Date(1999, 6, 8, 12, 34, 56);
    const target = Buffer.alloc(7);
    writeDateTime(target, date);
    expect(target.toString("hex")).toBe("cf0707080c2238");
    expect(readDateTime(target)).toEqual(date);
});
