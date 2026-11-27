import type { AppData, Assignment, Category, Course, GradeClass, LetterScaleInput } from "./types";

export const DEFAULT_SCALE_INPUT: LetterScaleInput = {
  a: "90",
  b: "80",
  c: "70",
  d: "60",
  plusMinus: false,
};

export function createId(): string {
  return crypto.randomUUID();
}

export function createAssignment(): Assignment {
  return { id: createId(), name: "", earned: "", possible: "" };
}

export function createCategory(name: string, weight: string, dropLowest = "0"): Category {
  return { id: createId(), name, weight, dropLowest, assignments: [] };
}

export function createClass(name = ""): GradeClass {
  return {
    id: createId(),
    name,
    scale: { ...DEFAULT_SCALE_INPUT },
    categories: [
      createCategory("Homework", "20"),
      createCategory("Quizzes", "30"),
      createCategory("Tests", "50"),
    ],
  };
}

export function createCourse(): Course {
  return { id: createId(), name: "", credits: "", letter: "A", level: "regular" };
}

export function freshAppData(): AppData {
  const created = createClass();
  return {
    theme: null,
    tab: "class",
    classes: [created],
    activeClassId: created.id,
    final: { current: "", weight: "", target: "" },
    gpa: { weighted: false, priorGpa: "", priorCredits: "", courses: [] },
  };
}

export function classLabel(gradeClass: GradeClass): string {
  const name = gradeClass.name.trim();
  return name.length > 0 ? name : "Untitled class";
}

export function categoryLabel(category: Category): string {
  const name = category.name.trim();
  return name.length > 0 ? name : "Untitled category";
}
