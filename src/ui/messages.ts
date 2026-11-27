import type { ClassGradeResult } from "../math/classGrade";
import type { GpaResult } from "../math/gpa";
import { categoryLabel } from "../model/defaults";
import type { FinalOutcome } from "../model/evaluate";
import type { GradeClass } from "../model/types";
import { formatFixed, formatTrimmed } from "./format";

export interface Banner {
  tone: "warn" | "note";
  text: string;
}

export interface Figure {
  kicker: string;
  figure: string;
  letter: string | null;
  detail: string;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function classBanners(gradeClass: GradeClass, grade: ClassGradeResult): Banner[] {
  const banners: Banner[] = [];
  if (!grade.weightsMatch100 && gradeClass.categories.length > 0) {
    banners.push({
      tone: "warn",
      text: `Category weights add up to ${formatFixed(grade.weightSum, 2)}%, not 100%.`,
    });
  }

  const empty: string[] = [];
  const dropped: string[] = [];
  const invalid: string[] = [];
  const zero: string[] = [];
  gradeClass.categories.forEach((category, index) => {
    const result = grade.categories[index];
    if (!result || result.included) return;
    const name = categoryLabel(category);
    if (result.reason === "empty") empty.push(name);
    else if (result.reason === "all-dropped") dropped.push(name);
    else if (result.reason === "invalid-weight") invalid.push(name);
    else if (result.reason === "zero-weight" && category.weight.trim() !== "") zero.push(name);
  });

  if (grade.percent !== null && empty.length > 0) {
    const verb = empty.length === 1 ? "has" : "have";
    banners.push({
      tone: "note",
      text: `${joinList(empty)} ${verb} no scores yet, so the other categories were rescaled.`,
    });
  }
  if (grade.percent !== null && dropped.length > 0) {
    banners.push({
      tone: "note",
      text: `Every score in ${joinList(dropped)} was dropped, so the other categories were rescaled.`,
    });
  }
  if (invalid.length > 0) {
    const verb =
      invalid.length === 1 ? "has a weight that is not a number" : "have weights that are not numbers";
    const left = invalid.length === 1 ? "it was" : "they were";
    banners.push({ tone: "warn", text: `${joinList(invalid)} ${verb}, so ${left} left out.` });
  }
  if (zero.length > 0) {
    const verb = zero.length === 1 ? "has" : "have";
    const left = zero.length === 1 ? "it was" : "they were";
    banners.push({ tone: "note", text: `${joinList(zero)} ${verb} a weight of 0, so ${left} left out.` });
  }
  return banners;
}

export function gradeFigure(grade: ClassGradeResult, letter: string | null, scaleOk: boolean): Figure {
  if (grade.rounded === null) {
    const droppedAll = grade.categories.some((category) => category.reason === "all-dropped");
    return {
      kicker: "Current grade",
      figure: "—",
      letter: "—",
      detail: droppedAll
        ? "Every scored assignment was dropped."
        : "Add assignment scores to see a grade.",
    };
  }
  const figure = `${formatFixed(grade.rounded, 2)}%`;
  if (!scaleOk) {
    return {
      kicker: "Current grade",
      figure,
      letter: "—",
      detail: "Fix the letter cutoffs to see a letter.",
    };
  }
  return { kicker: "Current grade", figure, letter: letter ?? "—", detail: "" };
}

function article(letter: string): string {
  return letter.startsWith("A") || letter.startsWith("F") ? "an" : "a";
}

export function finalFigure(outcome: FinalOutcome, letter: string | null): Figure {
  if (outcome === "incomplete") {
    return {
      kicker: "Final exam",
      figure: "—",
      letter: null,
      detail: "Enter a current grade, a final weight, and a target.",
    };
  }
  if (outcome.status === "invalid") {
    const detail =
      outcome.field === "current"
        ? "Enter a current grade from 0 to 200."
        : outcome.field === "weight"
          ? "Enter a final weight from 0 to 100."
          : "Enter a target from 0 to 100.";
    return { kicker: "Final exam", figure: "—", letter: null, detail };
  }
  if (outcome.neededRounded === null) {
    const guaranteed = outcome.status === "guaranteed";
    return {
      kicker: guaranteed ? "Guaranteed" : "Impossible",
      figure: guaranteed ? "Met" : "Short",
      letter: null,
      detail: guaranteed
        ? "The final has no weight, and the current grade already meets the target."
        : "The final has no weight, and the current grade is below the target.",
    };
  }

  const needed = formatFixed(outcome.neededRounded, 2);
  if (outcome.status === "guaranteed") {
    return {
      kicker: "Guaranteed",
      figure: "Met",
      letter: null,
      detail: `The target is already met. Even a 0 on the final leaves the class at ${formatFixed(outcome.floorRounded, 2)}%.`,
    };
  }
  if (outcome.status === "impossible") {
    return {
      kicker: "Impossible",
      figure: `${needed}%`,
      letter: null,
      detail: `You would need ${needed}%. A 100% on the final reaches ${formatFixed(outcome.ceilingRounded, 2)}%.`,
    };
  }
  const letterNote = letter ? ` That is ${article(letter)} ${letter} on the class scale.` : "";
  return {
    kicker: "Score needed",
    figure: `${needed}%`,
    letter: null,
    detail: `You need ${needed}% on the final.${letterNote}`,
  };
}

export function gpaFigure(result: GpaResult): Figure {
  if (result.cumulativeRounded === null) {
    return {
      kicker: "GPA",
      figure: "—",
      letter: null,
      detail:
        result.prior === "incomplete"
          ? "Enter both a prior GPA and the credits it covers."
          : "Add a course with credits and a letter grade.",
    };
  }

  const figure = formatFixed(result.cumulativeRounded, 2);
  if (result.prior === "used" && result.termRounded !== null) {
    return {
      kicker: "Cumulative GPA",
      figure,
      letter: null,
      detail: `${formatTrimmed(result.cumulativeCredits, 2)} credits in all. This term is ${formatFixed(result.termRounded, 2)}.`,
    };
  }
  if (result.prior === "used") {
    return {
      kicker: "Cumulative GPA",
      figure,
      letter: null,
      detail: `From ${formatTrimmed(result.cumulativeCredits, 2)} prior credits. No courses are counted this term.`,
    };
  }
  const incomplete =
    result.prior === "incomplete" ? " Enter both a prior GPA and the credits it covers." : "";
  return {
    kicker: "GPA",
    figure,
    letter: null,
    detail: `${formatTrimmed(result.termCredits, 2)} credits.${incomplete}`,
  };
}
