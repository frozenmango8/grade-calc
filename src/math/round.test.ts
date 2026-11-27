import { describe, expect, it } from "vitest";
import { roundHalfUp } from "./round";

describe("roundHalfUp", () => {
  it("rounds a trailing 5 away from zero", () => {
    expect(roundHalfUp(1.005, 2)).toBe(1.01);
    expect(roundHalfUp(1.015, 2)).toBe(1.02);
    expect(roundHalfUp(9.995, 2)).toBe(10);
    expect(roundHalfUp(10.005, 2)).toBe(10.01);
    expect(roundHalfUp(89.995, 2)).toBe(90);
    expect(roundHalfUp(99.995, 2)).toBe(100);
    expect(roundHalfUp(100.005, 2)).toBe(100.01);
    expect(roundHalfUp(1.5, 0)).toBe(2);
    expect(roundHalfUp(0.5, 0)).toBe(1);
  });

  it("rounds the same way below zero", () => {
    expect(roundHalfUp(-1.005, 2)).toBe(-1.01);
    expect(roundHalfUp(-1.5, 0)).toBe(-2);
    expect(roundHalfUp(-89.995, 2)).toBe(-90);
    expect(roundHalfUp(-1.004, 2)).toBe(-1);
  });

  it("leaves a digit below 5 where it is", () => {
    expect(roundHalfUp(1.004, 2)).toBe(1);
    expect(roundHalfUp(89.994, 2)).toBe(89.99);
    expect(roundHalfUp(8.994, 2)).toBe(8.99);
    expect(roundHalfUp(1.25, 2)).toBe(1.25);
  });

  it("rounds repeating divisions once", () => {
    expect(roundHalfUp(1 / 3, 2)).toBe(0.33);
    expect(roundHalfUp(2 / 3, 2)).toBe(0.67);
    expect(roundHalfUp(100 / 3, 2)).toBe(33.33);
    expect(roundHalfUp(200 / 3, 2)).toBe(66.67);
  });

  it("keeps whole numbers and zero", () => {
    expect(roundHalfUp(0, 2)).toBe(0);
    expect(roundHalfUp(100, 2)).toBe(100);
    expect(roundHalfUp(90, 0)).toBe(90);
  });

  it("passes non-finite values through", () => {
    expect(roundHalfUp(Number.NaN, 2)).toBeNaN();
    expect(roundHalfUp(Number.POSITIVE_INFINITY, 2)).toBe(Number.POSITIVE_INFINITY);
    expect(roundHalfUp(Number.NEGATIVE_INFINITY, 2)).toBe(Number.NEGATIVE_INFINITY);
  });

  it("rejects a bad place count", () => {
    expect(() => roundHalfUp(1, -1)).toThrow(RangeError);
    expect(() => roundHalfUp(1, 1.5)).toThrow(RangeError);
  });
});
