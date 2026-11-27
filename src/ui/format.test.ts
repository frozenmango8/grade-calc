import { describe, expect, it } from "vitest";
import { formatFixed, formatTrimmed } from "./format";

describe("format", () => {
  it("pads a displayed grade to two decimals", () => {
    expect(formatFixed(90, 2)).toBe("90.00");
    expect(formatFixed(85.756, 2)).toBe("85.76");
    expect(formatFixed(89.995, 2)).toBe("90.00");
  });

  it("trims trailing zeros when filling an input", () => {
    expect(formatTrimmed(90, 2)).toBe("90");
    expect(formatTrimmed(100, 2)).toBe("100");
    expect(formatTrimmed(90.5, 2)).toBe("90.5");
    expect(formatTrimmed(90.25, 2)).toBe("90.25");
    expect(formatTrimmed(3.5, 2)).toBe("3.5");
  });
});
