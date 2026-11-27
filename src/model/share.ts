import { createId } from "./defaults";
import { asBoolean, asString, isRecord } from "./guard";
import type { Assignment, Category, GradeClass, LetterScaleInput } from "./types";

const MAX_PAYLOAD = 200_000;

interface ShareBody {
  v: 1;
  name: string;
  scale: { a: string; b: string; c: string; d: string; pm: boolean };
  categories: Array<{
    name: string;
    weight: string;
    drop: string;
    assignments: Array<{ name: string; earned: string; possible: string }>;
  }>;
}

function clip(text: string, max: number): string {
  return text.slice(0, max);
}

export function encodeShare(gradeClass: GradeClass): string {
  const body: ShareBody = {
    v: 1,
    name: clip(gradeClass.name, 80),
    scale: {
      a: clip(gradeClass.scale.a, 16),
      b: clip(gradeClass.scale.b, 16),
      c: clip(gradeClass.scale.c, 16),
      d: clip(gradeClass.scale.d, 16),
      pm: gradeClass.scale.plusMinus,
    },
    categories: gradeClass.categories.slice(0, 30).map((category) => ({
      name: clip(category.name, 80),
      weight: clip(category.weight, 16),
      drop: clip(category.dropLowest, 8),
      assignments: category.assignments.slice(0, 100).map((assignment) => ({
        name: clip(assignment.name, 80),
        earned: clip(assignment.earned, 16),
        possible: clip(assignment.possible, 16),
      })),
    })),
  };
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(body)));
}

export function decodeShare(payload: string): GradeClass | null {
  if (payload.length === 0 || payload.length > MAX_PAYLOAD) return null;
  const bytes = base64UrlToBytes(payload);
  if (!bytes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  return classFromShare(parsed);
}

/** Null when the hash is not a share link. `{ cls: null }` when it is, but unreadable. */
export function readShareHash(hash: string): { cls: GradeClass | null } | null {
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!body.startsWith("c=")) return null;
  return { cls: decodeShare(body.slice(2)) };
}

export function shareUrl(href: string, gradeClass: GradeClass): string {
  const url = new URL(href);
  url.hash = `c=${encodeShare(gradeClass)}`;
  return url.toString();
}

function classFromShare(value: unknown): GradeClass | null {
  if (!isRecord(value) || value.v !== 1) return null;
  const name = asString(value.name, 80);
  const scale = readScale(value.scale);
  const categories = readCategories(value.categories);
  if (name === null || !scale || !categories) return null;
  return { id: createId(), name, scale, categories };
}

function readScale(value: unknown): LetterScaleInput | null {
  if (!isRecord(value)) return null;
  const a = asString(value.a, 16);
  const b = asString(value.b, 16);
  const c = asString(value.c, 16);
  const d = asString(value.d, 16);
  const plusMinus = asBoolean(value.pm);
  if (a === null || b === null || c === null || d === null || plusMinus === null) return null;
  return { a, b, c, d, plusMinus };
}

function readCategories(value: unknown): Category[] | null {
  if (!Array.isArray(value) || value.length > 30) return null;
  const categories: Category[] = [];
  for (const item of value) {
    const category = readCategory(item);
    if (!category) return null;
    categories.push(category);
  }
  return categories;
}

function readCategory(value: unknown): Category | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name, 80);
  const weight = asString(value.weight, 16);
  const dropLowest = asString(value.drop, 8);
  if (name === null || weight === null || dropLowest === null) return null;
  if (!Array.isArray(value.assignments) || value.assignments.length > 100) return null;
  const assignments: Assignment[] = [];
  for (const item of value.assignments) {
    const assignment = readAssignment(item);
    if (!assignment) return null;
    assignments.push(assignment);
  }
  return { id: createId(), name, weight, dropLowest, assignments };
}

function readAssignment(value: unknown): Assignment | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name, 80);
  const earned = asString(value.earned, 16);
  const possible = asString(value.possible, 16);
  if (name === null || earned === null || possible === null) return null;
  return { id: createId(), name, earned, possible };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const size = 0x8000;
  for (let index = 0; index < bytes.length; index += size) {
    const chunk = bytes.subarray(index, index + size);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  const remainder = text.length % 4;
  const padded = remainder === 0 ? text : text + "=".repeat(4 - remainder);
  try {
    const binary = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      const code = binary.charCodeAt(index);
      bytes[index] = code;
    }
    return bytes;
  } catch {
    return null;
  }
}
