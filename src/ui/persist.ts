import { deserialize, serialize } from "../model/storage";
import type { AppData } from "../model/types";

/** Also read by the small theme script in index.html. */
export const STORAGE_KEY = "grade-calc.v1";

export function loadApp(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function saveApp(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(data));
  } catch {
    // Storage can be blocked. The visit still works.
  }
}
