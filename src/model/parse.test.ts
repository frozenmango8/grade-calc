import { describe, expect, it } from "vitest";
import { fieldNumber, parseCount, parseDecimal } from "./parse";

describe("parseDecimal", () => {
  it("treats a blank field as empty and a trailing dot as unfinished", () => {
    expect(parseDecimal("")).toEqual({ state: "empty" });
    expect(parseDecimal("  ")).toEqual({ state: "empty" });
    expect(parseDecimal(".")).toEqual({ state: "incomplete" });
    expect(parseDecimal("8.")).toEqual({ state: "incomplete" });
  });

  it("reads ordinary non-negative decimals", () => {
    expect(parseDecimal("8")).toEqual({ state: "ok", value: 8 });
    expect(parseDecimal(" 8.50 ")).toEqual({ state: "ok", value: 8.5 });
    expect(parseDecimal(".5")).toEqual({ state: "ok", value: 0.5 });
    expect(parseDecimal("0")).toEqual({ state: "ok", value: 0 });
    expect(parseDecimal("00.5")).toEqual({ state: "ok", value: 0.5 });
  });

  it("rejects signs, scientific notation, and extra dots", () => {
    expect(parseDecimal("-1")).toEqual({ state: "invalid" });
    expect(parseDecimal("1e2")).toEqual({ state: "invalid" });
    expect(parseDecimal("8.5.1")).toEqual({ state: "invalid" });
    expect(parseDecimal("abc")).toEqual({ state: "invalid" });
    expect(parseDecimal("1,5")).toEqual({ state: "invalid" });
  });
});

describe("parseCount", () => {
  it("treats an empty field as zero and rejects fractions", () => {
    expect(parseCount("")).toEqual({ state: "ok", value: 0 });
    expect(parseCount("2")).toEqual({ state: "ok", value: 2 });
    expect(parseCount("01")).toEqual({ state: "ok", value: 1 });
    expect(parseCount("1.5")).toEqual({ state: "invalid" });
    expect(parseCount("-1")).toEqual({ state: "invalid" });
  });
});

describe("fieldNumber", () => {
  it("uses the digits already typed before a trailing dot", () => {
    expect(fieldNumber("")).toEqual({ kind: "blank" });
    expect(fieldNumber(".")).toEqual({ kind: "blank" });
    expect(fieldNumber("8.")).toEqual({ kind: "value", value: 8 });
    expect(fieldNumber("8.5")).toEqual({ kind: "value", value: 8.5 });
    expect(fieldNumber("abc")).toEqual({ kind: "bad" });
  });
});
