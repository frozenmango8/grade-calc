import type { CourseLevel } from "../math/gpa";

export type { CourseLevel };

export type Tab = "class" | "final" | "gpa";
export type ThemeChoice = "light" | "dark" | null;

export interface Assignment {
  id: string;
  name: string;
  earned: string;
  possible: string;
}

export interface Category {
  id: string;
  name: string;
  weight: string;
  dropLowest: string;
  assignments: Assignment[];
}

export interface LetterScaleInput {
  a: string;
  b: string;
  c: string;
  d: string;
  plusMinus: boolean;
}

export interface GradeClass {
  id: string;
  name: string;
  scale: LetterScaleInput;
  categories: Category[];
}

export interface FinalDraft {
  current: string;
  weight: string;
  target: string;
}

export interface Course {
  id: string;
  name: string;
  credits: string;
  letter: string;
  level: CourseLevel;
}

export interface GpaDraft {
  weighted: boolean;
  priorGpa: string;
  priorCredits: string;
  courses: Course[];
}

export interface AppData {
  theme: ThemeChoice;
  tab: Tab;
  classes: GradeClass[];
  activeClassId: string | null;
  final: FinalDraft;
  gpa: GpaDraft;
}
