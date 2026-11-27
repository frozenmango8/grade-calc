import { roundHalfUp } from "./round";

/** Unweighted 4.0 points. A and A+ are both 4.0. */
export const LETTER_POINTS: Record<string, number> = {
  "A+": 4,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  "D-": 0.7,
  F: 0,
};

export const GPA_LETTERS = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
] as const;

export type GpaLetter = (typeof GPA_LETTERS)[number];
export type CourseLevel = "regular" | "honors" | "apib";

export function gradePoints(
  letter: string,
  level: CourseLevel,
  weighted: boolean,
): number | null {
  const base = LETTER_POINTS[letter];
  if (base === undefined) return null;
  if (!weighted || level === "regular") return base;
  if (level === "honors") return base + 0.5;
  if (level === "apib") return base + 1;
  return null;
}

export interface CourseInput {
  credits: number | null;
  letter: string;
  level: CourseLevel;
}

export type PriorState = "absent" | "used" | "incomplete";

export interface GpaResult {
  termPoints: number;
  termCredits: number;
  termGpa: number | null;
  termRounded: number | null;
  cumulativePoints: number;
  cumulativeCredits: number;
  cumulativeGpa: number | null;
  cumulativeRounded: number | null;
  coursesCounted: number;
  prior: PriorState;
}

export interface GpaInput {
  courses: CourseInput[];
  weighted: boolean;
  /** Null when the field is empty. NaN when it was filled in but not a number. */
  priorGpa: number | null;
  priorCredits: number | null;
}

function priorState(priorGpa: number | null, priorCredits: number | null): PriorState {
  if (priorGpa === null && priorCredits === null) return "absent";
  if (
    priorGpa !== null &&
    priorCredits !== null &&
    Number.isFinite(priorGpa) &&
    Number.isFinite(priorCredits) &&
    priorGpa >= 0 &&
    priorCredits > 0
  ) {
    return "used";
  }
  return "incomplete";
}

/**
 * Term GPA and, when a prior record is complete, the cumulative GPA.
 * Honors adds 0.5 and AP/IB adds 1.0 in weighted mode, including an F.
 * The rounded fields are half up to two decimals. Quality points stay exact
 * until that final rounding.
 */
export function gpa(input: GpaInput): GpaResult {
  let termPoints = 0;
  let termCredits = 0;
  let coursesCounted = 0;

  for (const course of input.courses) {
    const credits = course.credits;
    if (credits === null || !Number.isFinite(credits) || credits <= 0) continue;
    const points = gradePoints(course.letter, course.level, input.weighted);
    if (points === null) continue;
    termPoints += points * credits;
    termCredits += credits;
    coursesCounted += 1;
  }

  const termGpa = termCredits > 0 ? termPoints / termCredits : null;
  const prior = priorState(input.priorGpa, input.priorCredits);

  let cumulativePoints = termPoints;
  let cumulativeCredits = termCredits;
  if (prior === "used" && input.priorGpa !== null && input.priorCredits !== null) {
    cumulativePoints += input.priorGpa * input.priorCredits;
    cumulativeCredits += input.priorCredits;
  }

  const cumulativeGpa = cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : null;

  return {
    termPoints,
    termCredits,
    termGpa,
    termRounded: termGpa === null ? null : roundHalfUp(termGpa, 2),
    cumulativePoints,
    cumulativeCredits,
    cumulativeGpa,
    cumulativeRounded: cumulativeGpa === null ? null : roundHalfUp(cumulativeGpa, 2),
    coursesCounted,
    prior,
  };
}
