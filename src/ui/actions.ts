import type {
  Assignment,
  Category,
  Course,
  FinalDraft,
  GpaDraft,
  LetterScaleInput,
  Tab,
} from "../model/types";

export interface UiState {
  notice: string;
  deleteArmed: boolean;
  shareFallback: string;
}

export interface Actions {
  setTab(tab: Tab): void;
  toggleTheme(): void;
  selectClass(id: string): void;
  addClass(): void;
  renameClass(name: string): void;
  armDelete(): void;
  copyLink(): void;
  addCategory(): void;
  patchCategory(id: string, patch: Partial<Pick<Category, "name" | "weight" | "dropLowest">>): void;
  removeCategory(id: string): void;
  addAssignment(categoryId: string): void;
  patchAssignment(
    categoryId: string,
    assignmentId: string,
    patch: Partial<Pick<Assignment, "name" | "earned" | "possible">>,
  ): void;
  removeAssignment(categoryId: string, assignmentId: string): void;
  patchScale(patch: Partial<LetterScaleInput>): void;
  patchFinal(patch: Partial<FinalDraft>): void;
  useClassGrade(): void;
  setTargetFromLetter(letter: string): void;
  patchGpa(patch: Partial<Pick<GpaDraft, "weighted" | "priorGpa" | "priorCredits">>): void;
  addCourse(): void;
  patchCourse(id: string, patch: Partial<Pick<Course, "name" | "credits" | "letter" | "level">>): void;
  removeCourse(id: string): void;
}
