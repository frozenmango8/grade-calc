import { describe, expect, it } from "vitest";
import { classGrade, type AssignmentScore, type CategoryInput } from "./classGrade";

function category(
  weight: number | null,
  assignments: Array<[number | null, number | null]>,
  dropLowest = 0,
): CategoryInput {
  return {
    weight,
    dropLowest,
    assignments: assignments.map(
      ([earned, possible]): AssignmentScore => ({ earned, possible }),
    ),
  };
}

describe("classGrade", () => {
  it("returns nothing when every category is empty", () => {
    const result = classGrade([
      category(20, []),
      category(30, []),
      category(50, []),
    ]);
    expect(result.percent).toBeNull();
    expect(result.rounded).toBeNull();
    expect(result.weightsMatch100).toBe(true);
    expect(result.categories.every((item) => item.reason === "empty")).toBe(true);
  });

  it("pools points inside a category instead of averaging percentages", () => {
    const result = classGrade([category(100, [[1, 2], [90, 100]])]);
    expect(result.percent).toBeCloseTo((91 / 102) * 100, 10);
    expect(result.rounded).toBe(89.22);
    expect(result.categories[0]?.kept).toEqual([0, 1]);
  });

  it("weights categories and rounds the total once", () => {
    const result = classGrade([
      category(20, [[100, 100]]),
      category(80, [[50, 100]]),
    ]);
    expect(result.percent).toBeCloseTo(60, 10);
    expect(result.rounded).toBe(60);

    const uneven = classGrade([
      category(90, [[2, 3]]),
      category(10, [[1, 3]]),
    ]);
    expect(uneven.percent).toBeCloseTo((1.9 / 3) * 100, 8);
    expect(uneven.rounded).toBe(63.33);
  });

  it("warns when the weights do not total 100, and still averages what is there", () => {
    const result = classGrade([
      category(40, [[100, 100]]),
      category(40, [[50, 100]]),
    ]);
    expect(result.weightSum).toBe(80);
    expect(result.weightsMatch100).toBe(false);
    expect(result.rounded).toBe(75);
  });

  it("accepts decimals that are meant to total 100 and rejects a short total", () => {
    const matched = classGrade([
      category(33.33, [[90, 100]]),
      category(33.33, [[90, 100]]),
      category(33.34, [[90, 100]]),
    ]);
    expect(matched.weightsMatch100).toBe(true);
    expect(matched.rounded).toBe(90);

    const short = classGrade([
      category(33.33, [[90, 100]]),
      category(33.33, [[90, 100]]),
      category(33.33, [[90, 100]]),
    ]);
    expect(short.weightSum).toBeCloseTo(99.99, 10);
    expect(short.weightsMatch100).toBe(false);
  });

  it("treats a weight a hair either side of 100 by its rounded value", () => {
    expect(classGrade([category(99.995, [[10, 10]])]).weightsMatch100).toBe(true);
    expect(classGrade([category(99.994, [[10, 10]])]).weightsMatch100).toBe(false);
    expect(classGrade([category(100.004, [[10, 10]])]).weightsMatch100).toBe(true);
    expect(classGrade([category(100.005, [[10, 10]])]).weightsMatch100).toBe(false);
  });

  it("leaves empty categories out and rescales the rest", () => {
    const result = classGrade([
      category(25, [[100, 100]]),
      category(25, []),
      category(50, [[80, 100]]),
    ]);
    expect(result.categories[1]?.reason).toBe("empty");
    expect(result.weightsMatch100).toBe(true);
    expect(result.percent).toBeCloseTo((100 * 25 + 80 * 50) / 75, 8);
    expect(result.rounded).toBe(86.67);
  });

  it("leaves out a zero weight even when it has scores", () => {
    const result = classGrade([
      category(0, [[100, 100]]),
      category(100, [[70, 100]]),
    ]);
    expect(result.categories[0]).toMatchObject({
      included: false,
      reason: "zero-weight",
      percent: 100,
    });
    expect(result.rounded).toBe(70);
    expect(result.weightsMatch100).toBe(true);
  });

  it("leaves out a category whose weight is not a number", () => {
    const result = classGrade([
      category(null, [[100, 100]]),
      category(100, [[80, 100]]),
    ]);
    expect(result.categories[0]?.reason).toBe("invalid-weight");
    expect(result.categories[0]?.weight).toBeNull();
    expect(result.rounded).toBe(80);
    expect(result.weightSum).toBe(100);
  });

  it("drops the lowest scores by rounded percentage", () => {
    const result = classGrade([
      category(100, [[10, 10], [5, 10], [8, 10]], 1),
    ]);
    expect(result.categories[0]?.dropped).toEqual([1]);
    expect(result.categories[0]?.kept).toEqual([0, 2]);
    expect(result.percent).toBeCloseTo(90, 10);
  });

  it("drops the lower percentage even when that assignment has more points", () => {
    const result = classGrade([category(100, [[1, 2], [10, 100]], 1)]);
    expect(result.categories[0]?.dropped).toEqual([1]);
    expect(result.rounded).toBe(50);
  });

  it("breaks percentage ties by dropping the smaller assignment, then the earlier one", () => {
    const bySize = classGrade([category(100, [[5, 10], [1, 2]], 1)]);
    expect(bySize.categories[0]?.dropped).toEqual([1]);
    expect(bySize.rounded).toBe(50);

    const byOrder = classGrade([category(100, [[5, 10], [5, 10]], 1)]);
    expect(byOrder.categories[0]?.dropped).toEqual([0]);
    expect(byOrder.rounded).toBe(50);
  });

  it("treats scores that round to the same percentage as a tie", () => {
    const result = classGrade([category(100, [[1, 3], [3333, 10000]], 1)]);
    expect(result.categories[0]?.dropped).toEqual([0]);
    expect(result.rounded).toBe(33.33);
  });

  it("drops every score when asked to drop at least that many", () => {
    const result = classGrade([category(50, [[9, 10], [8, 10]], 5), category(50, [[40, 50]])]);
    expect(result.categories[0]).toMatchObject({
      reason: "all-dropped",
      dropped: [0, 1],
      kept: [],
      percent: null,
    });
    expect(result.rounded).toBe(80);
  });

  it("ignores a drop count that is zero, negative, or not finite, and floors a fraction", () => {
    expect(classGrade([category(100, [[1, 10], [10, 10]], 0)]).rounded).toBe(55);
    expect(classGrade([category(100, [[1, 10], [10, 10]], -2)]).rounded).toBe(55);
    expect(classGrade([category(100, [[1, 10], [10, 10]], Number.NaN)]).rounded).toBe(55);
    expect(classGrade([category(100, [[1, 10], [5, 10], [10, 10]], 1.9)]).categories[0]?.dropped).toEqual([
      0,
    ]);
  });

  it("skips blank, impossible, and negative scores", () => {
    const result = classGrade([
      category(100, [
        [null, 10],
        [8, null],
        [8, 0],
        [-1, 10],
        [Number.NaN, 10],
        [9, 10],
      ]),
    ]);
    expect(result.categories[0]?.kept).toEqual([5]);
    expect(result.rounded).toBe(90);
  });

  it("allows extra credit above the points possible", () => {
    const result = classGrade([category(100, [[12, 10]])]);
    expect(result.rounded).toBe(120);
  });

  it("counts a real zero and ignores an empty weight as unusable only when it is null", () => {
    const zero = classGrade([category(100, [[0, 10]])]);
    expect(zero.rounded).toBe(0);
    expect(zero.categories[0]?.included).toBe(true);
  });
});
