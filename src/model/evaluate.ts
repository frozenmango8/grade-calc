import { classGrade, type ClassGradeResult } from "../math/classGrade";
import { finalExam, type FinalResult } from "../math/finalExam";
import { gpa, type GpaResult } from "../math/gpa";
import { isValidScale, letterFor, type LetterScale } from "../math/letter";
import type { FinalDraft, GpaDraft, GradeClass, LetterScaleInput } from "./types";
import { fieldNumber, parseCount } from "./parse";

export interface AssignmentView {
  percent: number | null;
  ignored: boolean;
}

export interface EvaluatedClass {
  grade: ClassGradeResult;
  scale: LetterScale | null;
  letter: string | null;
}

function weightOf(text: string): number | null {
  const field = fieldNumber(text);
  if (field.kind === "blank") return 0;
  if (field.kind === "value") return field.value;
  return null;
}

function pointsOf(text: string): number | null {
  const field = fieldNumber(text);
  return field.kind === "value" ? field.value : null;
}

export function readScale(input: LetterScaleInput): LetterScale | null {
  const a = pointsOf(input.a);
  const b = pointsOf(input.b);
  const c = pointsOf(input.c);
  const d = pointsOf(input.d);
  if (a === null || b === null || c === null || d === null) return null;
  const scale: LetterScale = { a, b, c, d, plusMinus: input.plusMinus };
  return isValidScale(scale) ? scale : null;
}

export function evaluateClass(gradeClass: GradeClass): EvaluatedClass {
  const grade = classGrade(
    gradeClass.categories.map((category) => {
      const drop = parseCount(category.dropLowest);
      return {
        weight: weightOf(category.weight),
        dropLowest: drop.state === "ok" ? drop.value : 0,
        assignments: category.assignments.map((assignment) => ({
          earned: pointsOf(assignment.earned),
          possible: pointsOf(assignment.possible),
        })),
      };
    }),
  );
  const scale = readScale(gradeClass.scale);
  const letter = grade.rounded === null || scale === null ? null : letterFor(grade.rounded, scale);
  return { grade, scale, letter };
}

export function viewAssignment(earned: string, possible: string): AssignmentView {
  const earnedField = fieldNumber(earned);
  const possibleField = fieldNumber(possible);
  if (earnedField.kind === "bad" || possibleField.kind === "bad") {
    return { percent: null, ignored: true };
  }
  if (earnedField.kind !== "value" || possibleField.kind !== "value") {
    return { percent: null, ignored: false };
  }
  if (possibleField.value <= 0) return { percent: null, ignored: true };
  const percent = (earnedField.value / possibleField.value) * 100;
  if (!Number.isFinite(percent)) return { percent: null, ignored: true };
  return { percent, ignored: false };
}

export type FinalOutcome = FinalResult | "incomplete";

export function evaluateFinal(draft: FinalDraft): FinalOutcome {
  const current = fieldNumber(draft.current);
  const weight = fieldNumber(draft.weight);
  const target = fieldNumber(draft.target);
  if (current.kind === "blank" || weight.kind === "blank" || target.kind === "blank") {
    return "incomplete";
  }
  return finalExam({
    current: current.kind === "value" ? current.value : Number.NaN,
    finalWeight: weight.kind === "value" ? weight.value : Number.NaN,
    target: target.kind === "value" ? target.value : Number.NaN,
  });
}

function priorNumber(text: string): number | null {
  const field = fieldNumber(text);
  if (field.kind === "blank") return null;
  if (field.kind === "bad") return Number.NaN;
  return field.value;
}

export function evaluateGpa(draft: GpaDraft): GpaResult {
  return gpa({
    weighted: draft.weighted,
    priorGpa: priorNumber(draft.priorGpa),
    priorCredits: priorNumber(draft.priorCredits),
    courses: draft.courses.map((course) => ({
      credits: priorNumber(course.credits),
      letter: course.letter,
      level: course.level,
    })),
  });
}
