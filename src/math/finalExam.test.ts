import { describe, expect, it } from "vitest";
import { finalExam } from "./finalExam";

describe("finalExam", () => {
  it("solves the standard weighted-final equation", () => {
    const result = finalExam({ current: 86, finalWeight: 40, target: 90 });
    expect(result).toMatchObject({ status: "need", neededRounded: 96 });
    if (result.status === "invalid") return;
    expect(result.needed).toBeCloseTo(96, 10);

    const light = finalExam({ current: 95, finalWeight: 20, target: 90 });
    expect(light).toMatchObject({ status: "need", neededRounded: 70 });

    const exact = finalExam({ current: 90, finalWeight: 10, target: 90 });
    expect(exact).toMatchObject({ status: "need", neededRounded: 90 });
  });

  it("ignores the current grade when the final is the whole class", () => {
    const result = finalExam({ current: 10, finalWeight: 100, target: 88 });
    expect(result).toMatchObject({
      status: "need",
      neededRounded: 88,
      floorRounded: 0,
      ceilingRounded: 100,
    });
  });

  it("calls a score of exactly 100 possible and a score of exactly 0 guaranteed", () => {
    expect(finalExam({ current: 75, finalWeight: 25, target: 81.25 })).toMatchObject({
      status: "need",
      neededRounded: 100,
    });
    expect(finalExam({ current: 90, finalWeight: 20, target: 72 })).toMatchObject({
      status: "guaranteed",
      neededRounded: 0,
    });
  });

  it("uses the rounded needed score for the boundary around 0 and 100", () => {
    expect(finalExam({ current: 0, finalWeight: 50, target: 50.002 })).toMatchObject({
      status: "need",
      neededRounded: 100,
    });
    expect(finalExam({ current: 0, finalWeight: 50, target: 50.0025 })).toMatchObject({
      status: "impossible",
      neededRounded: 100.01,
    });
    expect(finalExam({ current: 80, finalWeight: 25, target: 60.0013 })).toMatchObject({
      status: "need",
      neededRounded: 0.01,
    });
    expect(finalExam({ current: 80, finalWeight: 25, target: 60.0012 })).toMatchObject({
      status: "guaranteed",
      neededRounded: 0,
    });
  });

  it("marks a target above a perfect final as impossible and reports the ceiling", () => {
    const result = finalExam({ current: 80, finalWeight: 20, target: 95 });
    expect(result).toMatchObject({
      status: "impossible",
      neededRounded: 155,
      ceilingRounded: 84,
      floorRounded: 64,
    });
  });

  it("marks a target already secured by a zero as guaranteed", () => {
    const result = finalExam({ current: 90, finalWeight: 20, target: 70 });
    expect(result).toMatchObject({
      status: "guaranteed",
      neededRounded: -10,
      floorRounded: 72,
    });
  });

  it("handles a final that has no weight", () => {
    expect(finalExam({ current: 90, finalWeight: 0, target: 80 })).toMatchObject({
      status: "guaranteed",
      needed: null,
      neededRounded: null,
      floorRounded: 90,
      ceilingRounded: 90,
    });
    expect(finalExam({ current: 70, finalWeight: 0, target: 80 })).toMatchObject({
      status: "impossible",
      needed: null,
      floorRounded: 70,
    });
    expect(finalExam({ current: 89.996, finalWeight: 0, target: 90 }).status).toBe("guaranteed");
    expect(finalExam({ current: 89.994, finalWeight: 0, target: 90 }).status).toBe("impossible");
  });

  it("allows extra credit in the current grade and a target of 0 or 100", () => {
    expect(finalExam({ current: 110, finalWeight: 20, target: 100 })).toMatchObject({
      status: "need",
      neededRounded: 60,
    });
    expect(finalExam({ current: 0, finalWeight: 10, target: 0 })).toMatchObject({
      status: "guaranteed",
      neededRounded: 0,
    });
    expect(finalExam({ current: 200, finalWeight: 50, target: 100 })).toMatchObject({
      status: "guaranteed",
    });
  });

  it("rejects numbers outside the accepted ranges", () => {
    expect(finalExam({ current: -0.01, finalWeight: 20, target: 90 })).toEqual({
      status: "invalid",
      field: "current",
    });
    expect(finalExam({ current: 200.01, finalWeight: 20, target: 90 })).toEqual({
      status: "invalid",
      field: "current",
    });
    expect(finalExam({ current: Number.NaN, finalWeight: 20, target: 90 })).toEqual({
      status: "invalid",
      field: "current",
    });
    expect(finalExam({ current: 80, finalWeight: -1, target: 90 })).toEqual({
      status: "invalid",
      field: "weight",
    });
    expect(finalExam({ current: 80, finalWeight: 100.01, target: 90 })).toEqual({
      status: "invalid",
      field: "weight",
    });
    expect(finalExam({ current: 80, finalWeight: 20, target: -1 })).toEqual({
      status: "invalid",
      field: "target",
    });
    expect(finalExam({ current: 80, finalWeight: 20, target: 100.01 })).toEqual({
      status: "invalid",
      field: "target",
    });
    expect(finalExam({ current: 80, finalWeight: 20, target: Number.POSITIVE_INFINITY })).toEqual({
      status: "invalid",
      field: "target",
    });
  });
});
