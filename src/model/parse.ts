export type Parsed =
  | { state: "empty" }
  | { state: "incomplete" }
  | { state: "invalid" }
  | { state: "ok"; value: number };

export type FieldNumber = { kind: "blank" } | { kind: "bad" } | { kind: "value"; value: number };

const DECIMAL = /^(?:\d+\.\d+|\d+|\.\d+)$/;

/** A non-negative decimal typed into a field. A trailing dot is still in progress. */
export function parseDecimal(text: string): Parsed {
  const trimmed = text.trim();
  if (trimmed === "") return { state: "empty" };
  if (trimmed === "." || /^\d+\.$/.test(trimmed)) return { state: "incomplete" };
  if (!DECIMAL.test(trimmed)) return { state: "invalid" };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { state: "invalid" };
  return { state: "ok", value };
}

/** Whole number used for "drop lowest". An empty field means zero. */
export function parseCount(text: string): Parsed {
  const trimmed = text.trim();
  if (trimmed === "") return { state: "ok", value: 0 };
  if (!/^\d+$/.test(trimmed)) return { state: "invalid" };
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) return { state: "invalid" };
  return { state: "ok", value };
}

/**
 * Value to calculate with while the field is being typed.
 * "8." counts as 8. "." and "" count as blank. Anything else unusable is bad.
 */
export function fieldNumber(text: string): FieldNumber {
  const parsed = parseDecimal(text);
  if (parsed.state === "empty") return { kind: "blank" };
  if (parsed.state === "ok") return { kind: "value", value: parsed.value };
  if (parsed.state === "incomplete") {
    const digits = text.trim().slice(0, -1);
    if (digits === "") return { kind: "blank" };
    const value = Number(digits);
    return Number.isFinite(value) ? { kind: "value", value } : { kind: "bad" };
  }
  return { kind: "bad" };
}

export function fieldInvalid(text: string): boolean {
  return fieldNumber(text).kind === "bad";
}

export function countInvalid(text: string): boolean {
  return parseCount(text).state === "invalid";
}
