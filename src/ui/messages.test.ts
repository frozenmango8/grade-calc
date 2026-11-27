import { describe, expect, it } from "vitest";
import { createClass } from "../model/defaults";
import { evaluateClass, evaluateFinal } from "../model/evaluate";
import type { GradeClass } from "../model/types";
import { classBanners, finalFigure, gpaFigure } from "./messages";
import { gpa } from "../math/gpa";

function withScores(): GradeClass {
  const gradeClass = createClass("Biology");
  const tests = gradeClass.categories[2];
  if (!tests) throw new Error("missing tests");
  tests.assignments = [{ id: "t1", name: "Midterm", earned: "80", possible: "100" }];
  return gradeClass;
}

describe("classBanners", () => {
  it("names empty categories that were rescaled", () => {
    const gradeClass = withScores();
    const banners = classBanners(gradeClass, evaluateClass(gradeClass).grade);
    expect(banners.map((banner) => banner.text)).toEqual([
      "Homework and Quizzes have no scores yet, so the other categories were rescaled.",
    ]);
  });

  it("warns when the weights do not total 100", () => {
    const gradeClass = withScores();
    const homework = gradeClass.categories[0];
    if (!homework) throw new Error("missing homework");
    homework.weight = "10";
    const banners = classBanners(gradeClass, evaluateClass(gradeClass).grade);
    expect(banners[0]).toEqual({
      tone: "warn",
      text: "Category weights add up to 90.00%, not 100%.",
    });
  });

  it("says when every score in a category was dropped", () => {
    const gradeClass = withScores();
    const homework = gradeClass.categories[0];
    const quizzes = gradeClass.categories[1];
    if (!homework || !quizzes) throw new Error("missing category");
    homework.assignments = [{ id: "h1", name: "Packet", earned: "4", possible: "10" }];
    homework.dropLowest = "1";
    quizzes.assignments = [{ id: "q1", name: "Quiz", earned: "8", possible: "10" }];
    const banners = classBanners(gradeClass, evaluateClass(gradeClass).grade);
    expect(banners.map((banner) => banner.text)).toContain(
      "Every score in Homework was dropped, so the other categories were rescaled.",
    );
  });
});

describe("finalFigure", () => {
  it("describes a needed score, a guarantee, and an impossible target", () => {
    expect(finalFigure("incomplete", null).detail).toMatch(/Enter a current grade/);

    const needed = evaluateFinal({ current: "86", weight: "40", target: "90" });
    expect(finalFigure(needed, "A-").detail).toBe(
      "You need 96.00% on the final. That is an A- on the class scale.",
    );

    const guaranteed = evaluateFinal({ current: "90", weight: "20", target: "70" });
    expect(finalFigure(guaranteed, null).kicker).toBe("Guaranteed");
    expect(finalFigure(guaranteed, null).figure).toBe("Met");

    const impossible = evaluateFinal({ current: "80", weight: "20", target: "95" });
    expect(finalFigure(impossible, null)).toMatchObject({
      kicker: "Impossible",
      figure: "155.00%",
    });
    expect(finalFigure(impossible, null).detail).toMatch(/reaches 84.00%/);

    const weightless = evaluateFinal({ current: "70", weight: "0", target: "80" });
    expect(finalFigure(weightless, null)).toMatchObject({ kicker: "Impossible", figure: "Short" });
  });
});

describe("gpaFigure", () => {
  it("labels a cumulative GPA separately from the term", () => {
    const result = gpa({
      weighted: false,
      priorGpa: 3.5,
      priorCredits: 30,
      courses: [{ credits: 15, letter: "A", level: "regular" }],
    });
    const figure = gpaFigure(result);
    expect(figure.kicker).toBe("Cumulative GPA");
    expect(figure.figure).toBe("3.67");
    expect(figure.detail).toMatch(/This term is 4.00/);
  });
});
