import { roundHalfUp } from "./round";

export interface AssignmentScore {
  earned: number | null;
  possible: number | null;
}

export interface CategoryInput {
  /** Null when the weight is not a usable number. */
  weight: number | null;
  dropLowest: number;
  assignments: AssignmentScore[];
}

export type CategoryExcludeReason = "invalid-weight" | "zero-weight" | "empty";

export interface CategoryResult {
  /** Exact category percentage from pooled points. Null when nothing was kept. */
  percent: number | null;
  weight: number | null;
  included: boolean;
  reason: CategoryExcludeReason | null;
  /** Indexes into the original assignment list. */
  dropped: number[];
  kept: number[];
}

export interface ClassGradeResult {
  /** Exact percentage. Null when no category counts. */
  percent: number | null;
  /** `percent` rounded half up to two decimals. */
  rounded: number | null;
  /** Sum of numeric weights, including categories that were left out. */
  weightSum: number;
  weightsMatch100: boolean;
  categories: CategoryResult[];
}

interface PreparedAssignment {
  index: number;
  earned: number;
  possible: number;
  percent: number;
}

function graded(assignments: AssignmentScore[]): PreparedAssignment[] {
  const rows: PreparedAssignment[] = [];
  assignments.forEach((assignment, index) => {
    const { earned, possible } = assignment;
    if (earned === null || possible === null) return;
    if (!Number.isFinite(earned) || !Number.isFinite(possible)) return;
    if (earned < 0 || possible <= 0) return;
    const percent = (earned / possible) * 100;
    if (!Number.isFinite(percent)) return;
    rows.push({ index, earned, possible, percent });
  });
  return rows;
}

function dropCount(value: number, available: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(available, Math.floor(value));
}

function categoryPercent(rows: PreparedAssignment[]): number | null {
  let earned = 0;
  let possible = 0;
  for (const row of rows) {
    earned += row.earned;
    possible += row.possible;
  }
  if (!(possible > 0)) return null;
  const percent = (earned / possible) * 100;
  return Number.isFinite(percent) ? percent : null;
}

/**
 * Weighted class grade.
 *
 * Points inside a category are pooled, not averaged assignment by assignment.
 * The lowest N are removed first. Ties break on the smaller point total, then
 * on the earlier assignment, using percentages rounded to two decimals so two
 * scores that display the same are treated as a tie.
 *
 * Included categories are combined by weight and divided by the included
 * weight, not by 100. Empty categories therefore drop out and the rest are
 * rescaled. A weight total other than 100 still produces a grade; `weightsMatch100`
 * is how the screen decides to warn.
 */
export function classGrade(categories: CategoryInput[]): ClassGradeResult {
  const results = categories.map((category): CategoryResult => {
    const scores = graded(category.assignments);
    const ranked = [...scores].sort((a, b) => {
      const byPercent = roundHalfUp(a.percent, 2) - roundHalfUp(b.percent, 2);
      if (byPercent !== 0) return byPercent;
      if (a.possible !== b.possible) return a.possible - b.possible;
      return a.index - b.index;
    });

    const removing = dropCount(category.dropLowest, ranked.length);
    const dropped = ranked.slice(0, removing).map((row) => row.index);
    const keptRows = ranked.slice(removing);
    const kept = keptRows.map((row) => row.index);
    dropped.sort((a, b) => a - b);
    kept.sort((a, b) => a - b);

    const percent = categoryPercent(keptRows);
    const weight = category.weight;
    const base = { percent, dropped, kept };

    if (weight === null || !Number.isFinite(weight) || weight < 0) {
      return { ...base, weight: null, included: false, reason: "invalid-weight" };
    }
    if (weight === 0) {
      return { ...base, weight: 0, included: false, reason: "zero-weight" };
    }
    if (keptRows.length === 0) {
      return { ...base, weight, included: false, reason: "empty" };
    }
    return { ...base, weight, included: true, reason: null };
  });

  let weightSum = 0;
  let includedWeight = 0;
  let weighted = 0;
  for (const category of results) {
    if (category.weight !== null) weightSum += category.weight;
    if (category.included && category.percent !== null && category.weight !== null) {
      includedWeight += category.weight;
      weighted += category.percent * category.weight;
    }
  }

  const percent = includedWeight > 0 ? weighted / includedWeight : null;
  return {
    percent,
    rounded: percent === null ? null : roundHalfUp(percent, 2),
    weightSum,
    weightsMatch100: roundHalfUp(weightSum, 2) === 100,
    categories: results,
  };
}
