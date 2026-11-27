import { describe, expect, it } from "vitest";
import { gradePoints, gpa, LETTER_POINTS, type CourseInput, type CourseLevel } from "./gpa";

function course(
  credits: number | null,
  letter: string,
  level: CourseLevel = "regular",
): CourseInput {
  return { credits, letter, level };
}

describe("gradePoints", () => {
  it("uses a 4.0 scale where A and A+ are both 4", () => {
    expect(LETTER_POINTS["A+"]).toBe(4);
    expect(gradePoints("A+", "regular", false)).toBe(4);
    expect(gradePoints("A", "regular", false)).toBe(4);
    expect(gradePoints("A-", "regular", false)).toBe(3.7);
    expect(gradePoints("B+", "regular", false)).toBe(3.3);
    expect(gradePoints("B", "regular", false)).toBe(3);
    expect(gradePoints("B-", "regular", false)).toBe(2.7);
    expect(gradePoints("C+", "regular", false)).toBe(2.3);
    expect(gradePoints("C", "regular", false)).toBe(2);
    expect(gradePoints("C-", "regular", false)).toBe(1.7);
    expect(gradePoints("D+", "regular", false)).toBe(1.3);
    expect(gradePoints("D", "regular", false)).toBe(1);
    expect(gradePoints("D-", "regular", false)).toBe(0.7);
    expect(gradePoints("F", "regular", false)).toBe(0);
  });

  it("adds 0.5 for Honors and 1.0 for AP/IB only when weighted", () => {
    expect(gradePoints("A", "honors", true)).toBe(4.5);
    expect(gradePoints("A", "apib", true)).toBe(5);
    expect(gradePoints("B-", "honors", true)).toBe(3.2);
    expect(gradePoints("F", "apib", true)).toBe(1);
    expect(gradePoints("F", "honors", true)).toBe(0.5);
    expect(gradePoints("A", "honors", false)).toBe(4);
    expect(gradePoints("A", "apib", false)).toBe(4);
  });

  it("rejects an unknown letter", () => {
    expect(gradePoints("E", "regular", false)).toBeNull();
    expect(gradePoints("a", "regular", false)).toBeNull();
    expect(gradePoints("", "regular", false)).toBeNull();
  });
});

describe("gpa", () => {
  it("averages quality points by credits", () => {
    const result = gpa({
      weighted: false,
      priorGpa: null,
      priorCredits: null,
      courses: [course(3, "A"), course(3, "B"), course(1, "C")],
    });
    expect(result.termPoints).toBe(4 * 3 + 3 * 3 + 2);
    expect(result.termCredits).toBe(7);
    expect(result.termRounded).toBe(3.29);
    expect(result.cumulativeRounded).toBe(3.29);
    expect(result.coursesCounted).toBe(3);
    expect(result.prior).toBe("absent");
  });

  it("rounds a repeating GPA half up", () => {
    const result = gpa({
      weighted: false,
      priorGpa: null,
      priorCredits: null,
      courses: [course(3, "A-"), course(1, "B")],
    });
    expect(result.termGpa).toBeCloseTo(3.525, 10);
    expect(result.termRounded).toBe(3.53);
  });

  it("keeps an exact 4.0 and an exact 0", () => {
    expect(
      gpa({
        weighted: false,
        priorGpa: null,
        priorCredits: null,
        courses: [course(4, "A+"), course(2, "A")],
      }).termRounded,
    ).toBe(4);
    expect(
      gpa({
        weighted: false,
        priorGpa: null,
        priorCredits: null,
        courses: [course(3, "F")],
      }).termRounded,
    ).toBe(0);
  });

  it("weights Honors and AP/IB and ignores level when weighting is off", () => {
    const courses = [
      course(3, "A"),
      course(3, "B+", "honors"),
      course(4, "A", "apib"),
    ];
    const weighted = gpa({ weighted: true, priorGpa: null, priorCredits: null, courses });
    expect(weighted.termPoints).toBe(4 * 3 + 3.8 * 3 + 5 * 4);
    expect(weighted.termRounded).toBe(4.34);

    const plain = gpa({ weighted: false, priorGpa: null, priorCredits: null, courses });
    expect(plain.termPoints).toBe(4 * 3 + 3.3 * 3 + 4 * 4);
    expect(plain.termRounded).toBe(3.79);
  });

  it("accepts half credits", () => {
    const result = gpa({
      weighted: false,
      priorGpa: null,
      priorCredits: null,
      courses: [course(0.5, "A"), course(0.5, "B")],
    });
    expect(result.termCredits).toBe(1);
    expect(result.termRounded).toBe(3.5);
  });

  it("skips blank credits, zero credits, and unknown letters", () => {
    const result = gpa({
      weighted: false,
      priorGpa: null,
      priorCredits: null,
      courses: [course(null, "A"), course(0, "A"), course(-1, "B"), course(3, "E"), course(3, "A")],
    });
    expect(result.coursesCounted).toBe(1);
    expect(result.termRounded).toBe(4);
  });

  it("returns no GPA when nothing counts", () => {
    const result = gpa({
      weighted: false,
      priorGpa: null,
      priorCredits: null,
      courses: [],
    });
    expect(result.termGpa).toBeNull();
    expect(result.cumulativeGpa).toBeNull();
    expect(result.termRounded).toBeNull();
    expect(result.cumulativeRounded).toBeNull();
  });

  it("combines a prior GPA with the term", () => {
    const result = gpa({
      weighted: false,
      priorGpa: 3.5,
      priorCredits: 30,
      courses: [course(15, "A")],
    });
    expect(result.prior).toBe("used");
    expect(result.termRounded).toBe(4);
    expect(result.cumulativePoints).toBe(3.5 * 30 + 60);
    expect(result.cumulativeCredits).toBe(45);
    expect(result.cumulativeGpa).toBeCloseTo(3.6666666667, 8);
    expect(result.cumulativeRounded).toBe(3.67);
  });

  it("uses the prior record alone when this term has no courses", () => {
    const result = gpa({
      weighted: true,
      priorGpa: 3.875,
      priorCredits: 12,
      courses: [],
    });
    expect(result.prior).toBe("used");
    expect(result.termGpa).toBeNull();
    expect(result.cumulativeRounded).toBe(3.88);
    expect(result.cumulativeCredits).toBe(12);
  });

  it("ignores a prior GPA of zero credits and an incomplete pair", () => {
    const zeroCredits = gpa({
      weighted: false,
      priorGpa: 3.9,
      priorCredits: 0,
      courses: [course(3, "B")],
    });
    expect(zeroCredits.prior).toBe("incomplete");
    expect(zeroCredits.cumulativeRounded).toBe(3);

    const missingCredits = gpa({
      weighted: false,
      priorGpa: 3.2,
      priorCredits: null,
      courses: [course(3, "A")],
    });
    expect(missingCredits.prior).toBe("incomplete");
    expect(missingCredits.cumulativeRounded).toBe(4);

    const missingGpa = gpa({
      weighted: false,
      priorGpa: null,
      priorCredits: 15,
      courses: [],
    });
    expect(missingGpa.prior).toBe("incomplete");
    expect(missingGpa.cumulativeGpa).toBeNull();
  });

  it("rejects a negative prior GPA or a non-finite prior value", () => {
    expect(
      gpa({
        weighted: false,
        priorGpa: -0.1,
        priorCredits: 10,
        courses: [course(3, "A")],
      }).prior,
    ).toBe("incomplete");
    expect(
      gpa({
        weighted: false,
        priorGpa: Number.NaN,
        priorCredits: 10,
        courses: [],
      }).prior,
    ).toBe("incomplete");
  });

  it("allows a prior GPA above 4 when earlier terms were weighted", () => {
    const result = gpa({
      weighted: false,
      priorGpa: 4.8,
      priorCredits: 6,
      courses: [course(3, "A")],
    });
    expect(result.prior).toBe("used");
    expect(result.cumulativePoints).toBe(4.8 * 6 + 12);
    expect(result.cumulativeRounded).toBe(4.53);
  });
});
