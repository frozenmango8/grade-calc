import { describe, expect, it } from "vitest";
import { createClass } from "./defaults";
import { evaluateClass, evaluateFinal, evaluateGpa, viewAssignment } from "./evaluate";
import type { GradeClass } from "./types";

function sampleClass(): GradeClass {
  const gradeClass = createClass("Biology");
  const homework = gradeClass.categories[0];
  const quizzes = gradeClass.categories[1];
  const tests = gradeClass.categories[2];
  if (!homework || !quizzes || !tests) throw new Error("expected three categories");
  homework.assignments = [
    { id: "h1", name: "Packet 1", earned: "9", possible: "10" },
    { id: "h2", name: "Packet 2", earned: "4", possible: "10" },
    { id: "h3", name: "Packet 3", earned: "10.", possible: "10" },
  ];
  homework.dropLowest = "1";
  quizzes.assignments = [
    { id: "q1", name: "Quiz 1", earned: "18", possible: "20" },
    { id: "q2", name: "Quiz 2", earned: "15", possible: "20" },
  ];
  tests.assignments = [{ id: "t1", name: "Midterm", earned: "84", possible: "100" }];
  return gradeClass;
}

describe("evaluateClass", () => {
  it("drops the lowest homework score and rounds the class to two decimals", () => {
    const result = evaluateClass(sampleClass());
    expect(result.grade.categories[0]?.dropped).toEqual([1]);
    expect(result.grade.rounded).toBe(85.75);
    expect(result.letter).toBe("B");
    expect(result.grade.weightsMatch100).toBe(true);
  });

  it("switches the letter when plus and minus are on", () => {
    const gradeClass = sampleClass();
    gradeClass.scale.plusMinus = true;
    expect(evaluateClass(gradeClass).letter).toBe("B");
  });

  it("leaves a category out when its weight is not a number", () => {
    const gradeClass = sampleClass();
    const homework = gradeClass.categories[0];
    if (!homework) throw new Error("missing homework");
    homework.weight = "abc";
    const result = evaluateClass(gradeClass);
    expect(result.grade.categories[0]?.reason).toBe("invalid-weight");
    expect(result.grade.rounded).toBe(83.44);
  });

  it("returns no letter when the cutoffs are out of order", () => {
    const gradeClass = sampleClass();
    gradeClass.scale.a = "70";
    const result = evaluateClass(gradeClass);
    expect(result.scale).toBeNull();
    expect(result.letter).toBeNull();
    expect(result.grade.rounded).toBe(85.75);
  });
});

describe("viewAssignment", () => {
  it("ignores a bad entry and waits when a box is still empty", () => {
    expect(viewAssignment("", "")).toEqual({ percent: null, ignored: false });
    expect(viewAssignment("9", "")).toEqual({ percent: null, ignored: false });
    expect(viewAssignment("9", "10")).toEqual({ percent: 90, ignored: false });
    expect(viewAssignment("abc", "10")).toEqual({ percent: null, ignored: true });
    expect(viewAssignment("9", "0")).toEqual({ percent: null, ignored: true });
  });
});

describe("evaluateFinal", () => {
  it("stays incomplete until every field has a number", () => {
    expect(evaluateFinal({ current: "90", weight: "", target: "80" })).toBe("incomplete");
    expect(evaluateFinal({ current: "90", weight: ".", target: "80" })).toBe("incomplete");
  });

  it("reports an impossible target from the typed values", () => {
    const result = evaluateFinal({ current: "86", weight: "20", target: "90" });
    expect(result).toMatchObject({ status: "impossible", neededRounded: 106 });
  });
});

describe("evaluateGpa", () => {
  it("weights an AP course and folds in a prior record", () => {
    const result = evaluateGpa({
      weighted: true,
      priorGpa: "3.5",
      priorCredits: "30",
      courses: [{ id: "c1", name: "Calculus", credits: "4", letter: "A", level: "apib" }],
    });
    expect(result.termRounded).toBe(5);
    expect(result.cumulativeRounded).toBe(3.68);
    expect(result.prior).toBe("used");
  });
});
