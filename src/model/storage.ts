import { GPA_LETTERS } from "../math/gpa";
import { asBoolean, asId, asString, isRecord } from "./guard";
import type {
  AppData,
  Assignment,
  Category,
  Course,
  CourseLevel,
  FinalDraft,
  GpaDraft,
  GradeClass,
  LetterScaleInput,
  Tab,
  ThemeChoice,
} from "./types";

const LEVELS: readonly CourseLevel[] = ["regular", "honors", "apib"];
const LETTERS: readonly string[] = GPA_LETTERS;

export function serialize(data: AppData): string {
  return JSON.stringify({ v: 1, ...data });
}

export function deserialize(raw: string): AppData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.v !== 1) return null;

  const classes = readClasses(parsed.classes);
  if (!classes) return null;

  let activeClassId = parsed.activeClassId === null ? null : asId(parsed.activeClassId);
  if (activeClassId !== null && !classes.some((item) => item.id === activeClassId)) {
    activeClassId = null;
  }
  if (activeClassId === null && classes.length > 0) {
    activeClassId = classes[0]?.id ?? null;
  }

  return {
    theme: readTheme(parsed.theme),
    tab: readTab(parsed.tab),
    classes,
    activeClassId,
    final: readFinal(parsed.final),
    gpa: readGpa(parsed.gpa),
  };
}

function readTheme(value: unknown): ThemeChoice {
  if (value === "light" || value === "dark" || value === null) return value;
  return null;
}

function readTab(value: unknown): Tab {
  if (value === "class" || value === "final" || value === "gpa") return value;
  return "class";
}

function readClasses(value: unknown): GradeClass[] | null {
  if (!Array.isArray(value) || value.length > 40) return null;
  const classes: GradeClass[] = [];
  for (const item of value) {
    const gradeClass = readClass(item);
    if (gradeClass) classes.push(gradeClass);
  }
  return classes;
}

function readClass(value: unknown): GradeClass | null {
  if (!isRecord(value)) return null;
  const id = asId(value.id);
  const name = asString(value.name, 80);
  const scale = readScale(value.scale);
  const categories = readCategories(value.categories);
  if (!id || name === null || !scale || !categories) return null;
  return { id, name, scale, categories };
}

function readScale(value: unknown): LetterScaleInput | null {
  if (!isRecord(value)) return null;
  const a = asString(value.a, 16);
  const b = asString(value.b, 16);
  const c = asString(value.c, 16);
  const d = asString(value.d, 16);
  const plusMinus = asBoolean(value.plusMinus);
  if (a === null || b === null || c === null || d === null || plusMinus === null) return null;
  return { a, b, c, d, plusMinus };
}

function readCategories(value: unknown): Category[] | null {
  if (!Array.isArray(value) || value.length > 30) return null;
  const categories: Category[] = [];
  for (const item of value) {
    const category = readCategory(item);
    if (category) categories.push(category);
  }
  return categories;
}

function readCategory(value: unknown): Category | null {
  if (!isRecord(value)) return null;
  const id = asId(value.id);
  const name = asString(value.name, 80);
  const weight = asString(value.weight, 16);
  const dropLowest = asString(value.dropLowest, 8);
  if (!id || name === null || weight === null || dropLowest === null) return null;
  if (!Array.isArray(value.assignments) || value.assignments.length > 100) return null;
  const assignments: Assignment[] = [];
  for (const item of value.assignments) {
    const assignment = readAssignment(item);
    if (assignment) assignments.push(assignment);
  }
  return { id, name, weight, dropLowest, assignments };
}

function readAssignment(value: unknown): Assignment | null {
  if (!isRecord(value)) return null;
  const id = asId(value.id);
  const name = asString(value.name, 80);
  const earned = asString(value.earned, 16);
  const possible = asString(value.possible, 16);
  if (!id || name === null || earned === null || possible === null) return null;
  return { id, name, earned, possible };
}

function readFinal(value: unknown): FinalDraft {
  if (!isRecord(value)) return { current: "", weight: "", target: "" };
  return {
    current: asString(value.current, 16) ?? "",
    weight: asString(value.weight, 16) ?? "",
    target: asString(value.target, 16) ?? "",
  };
}

function readGpa(value: unknown): GpaDraft {
  if (!isRecord(value)) {
    return { weighted: false, priorGpa: "", priorCredits: "", courses: [] };
  }
  const courses: Course[] = [];
  if (Array.isArray(value.courses)) {
    for (const item of value.courses.slice(0, 80)) {
      const course = readCourse(item);
      if (course) courses.push(course);
    }
  }
  return {
    weighted: value.weighted === true,
    priorGpa: asString(value.priorGpa, 16) ?? "",
    priorCredits: asString(value.priorCredits, 16) ?? "",
    courses,
  };
}

function readCourse(value: unknown): Course | null {
  if (!isRecord(value)) return null;
  const id = asId(value.id);
  const name = asString(value.name, 80);
  const credits = asString(value.credits, 16);
  const letter = asString(value.letter, 4);
  if (!id || name === null || credits === null || letter === null) return null;
  if (!LETTERS.includes(letter)) return null;
  if (!LEVELS.includes(value.level as CourseLevel)) return null;
  return { id, name, credits, letter, level: value.level as CourseLevel };
}
