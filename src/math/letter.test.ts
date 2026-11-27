import { describe, expect, it } from "vitest";
import { DEFAULT_SCALE, isValidScale, letterCuts, letterFor, type LetterScale } from "./letter";

const plain: LetterScale = { ...DEFAULT_SCALE };
const thirds: LetterScale = { ...DEFAULT_SCALE, plusMinus: true };

describe("isValidScale", () => {
  it("accepts the default scale and a zero floor for D", () => {
    expect(isValidScale(plain)).toBe(true);
    expect(isValidScale({ ...plain, d: 0 })).toBe(true);
    expect(isValidScale({ ...plain, a: 100 })).toBe(true);
  });

  it("rejects unordered, out of range, and non-finite cutoffs", () => {
    expect(isValidScale({ ...plain, a: 80, b: 90 })).toBe(false);
    expect(isValidScale({ ...plain, a: 90, b: 90 })).toBe(false);
    expect(isValidScale({ ...plain, a: 100.01 })).toBe(false);
    expect(isValidScale({ ...plain, d: -1 })).toBe(false);
    expect(isValidScale({ ...plain, c: Number.NaN })).toBe(false);
    expect(isValidScale({ ...plain, b: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe("letterFor", () => {
  it("uses the default cutoffs, with the boundary belonging to the higher letter", () => {
    expect(letterFor(100, plain)).toBe("A");
    expect(letterFor(90, plain)).toBe("A");
    expect(letterFor(89.99, plain)).toBe("B");
    expect(letterFor(80, plain)).toBe("B");
    expect(letterFor(79.99, plain)).toBe("C");
    expect(letterFor(70, plain)).toBe("C");
    expect(letterFor(69.99, plain)).toBe("D");
    expect(letterFor(60, plain)).toBe("D");
    expect(letterFor(59.99, plain)).toBe("F");
    expect(letterFor(0, plain)).toBe("F");
  });

  it("rounds the percentage half up before choosing the letter", () => {
    expect(letterFor(89.995, plain)).toBe("A");
    expect(letterFor(89.994, plain)).toBe("B");
    expect(letterFor(59.995, plain)).toBe("D");
    expect(letterFor(59.994, plain)).toBe("F");
  });

  it("keeps extra credit on the top letter", () => {
    expect(letterFor(105, plain)).toBe("A");
    expect(letterFor(105, thirds)).toBe("A+");
    expect(letterFor(-0.01, plain)).toBe("F");
  });

  it("splits each letter into equal thirds when plus and minus are on", () => {
    expect(letterFor(100, thirds)).toBe("A+");
    expect(letterFor(96.67, thirds)).toBe("A+");
    expect(letterFor(96.66, thirds)).toBe("A");
    expect(letterFor(93.33, thirds)).toBe("A");
    expect(letterFor(93.32, thirds)).toBe("A-");
    expect(letterFor(90, thirds)).toBe("A-");
    expect(letterFor(89.995, thirds)).toBe("A-");
    expect(letterFor(89.99, thirds)).toBe("B+");
    expect(letterFor(86.67, thirds)).toBe("B+");
    expect(letterFor(86.66, thirds)).toBe("B");
    expect(letterFor(83.33, thirds)).toBe("B");
    expect(letterFor(83.32, thirds)).toBe("B-");
    expect(letterFor(80, thirds)).toBe("B-");
    expect(letterFor(79.99, thirds)).toBe("C+");
    expect(letterFor(70, thirds)).toBe("C-");
    expect(letterFor(66.67, thirds)).toBe("D+");
    expect(letterFor(63.33, thirds)).toBe("D");
    expect(letterFor(60, thirds)).toBe("D-");
    expect(letterFor(59.99, thirds)).toBe("F");
  });

  it("follows uneven cutoffs", () => {
    const scale: LetterScale = { a: 92, b: 80, c: 70, d: 60, plusMinus: true };
    expect(letterFor(92, scale)).toBe("A-");
    expect(letterFor(94.67, scale)).toBe("A");
    expect(letterFor(94.66, scale)).toBe("A-");
    expect(letterFor(97.33, scale)).toBe("A+");
    expect(letterFor(91.99, scale)).toBe("B+");
  });

  it("gives a zero-width A band only to a perfect score", () => {
    const scale: LetterScale = { a: 100, b: 80, c: 70, d: 60, plusMinus: true };
    expect(letterFor(100, scale)).toBe("A+");
    expect(letterFor(99.99, scale)).toBe("B+");
    expect(letterFor(100, { ...scale, plusMinus: false })).toBe("A");
    expect(letterFor(99.99, { ...scale, plusMinus: false })).toBe("B");
  });

  it("prefers the higher letter when rounded boundaries collide", () => {
    const scale: LetterScale = { a: 90, b: 89.99, c: 70, d: 60, plusMinus: true };
    expect(letterFor(90, scale)).toBe("A-");
    expect(letterFor(89.99, scale)).toBe("B");
  });

  it("returns null for a bad scale or a non-finite percentage", () => {
    expect(letterFor(90, { ...plain, a: 70 })).toBeNull();
    expect(letterFor(Number.NaN, plain)).toBeNull();
    expect(letterFor(Number.POSITIVE_INFINITY, plain)).toBeNull();
  });
});

describe("letterCuts", () => {
  it("lists plain cutoffs at the edited minimums", () => {
    expect(letterCuts(plain)).toEqual([
      { letter: "A", min: 90 },
      { letter: "B", min: 80 },
      { letter: "C", min: 70 },
      { letter: "D", min: 60 },
    ]);
  });

  it("rounds plus and minus boundaries to two decimals", () => {
    expect(letterCuts(thirds)?.find((cut) => cut.letter === "A")).toEqual({
      letter: "A",
      min: 93.33,
    });
    expect(letterCuts(thirds)?.find((cut) => cut.letter === "A+")).toEqual({
      letter: "A+",
      min: 96.67,
    });
    expect(letterCuts(thirds)?.find((cut) => cut.letter === "B-")).toEqual({
      letter: "B-",
      min: 80,
    });
  });

  it("returns null when the scale is invalid", () => {
    expect(letterCuts({ ...plain, d: 80 })).toBeNull();
  });
});
