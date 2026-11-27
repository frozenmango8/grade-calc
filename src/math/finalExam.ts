import { roundHalfUp } from "./round";

export interface FinalInput {
  /** Percentage in the class before the final. May include extra credit, up to 200. */
  current: number;
  /** Share of the class the final is worth, from 0 to 100. */
  finalWeight: number;
  /** Percentage the student wants in the class, from 0 to 100. */
  target: number;
}

export type FinalStatus = "guaranteed" | "impossible" | "need";

export type FinalResult =
  | { status: "invalid"; field: "current" | "weight" | "target" }
  | {
      status: FinalStatus;
      /**
       * Exact score required on the final. Null when the final has no weight,
       * because there is no score that changes the grade.
       */
      needed: number | null;
      neededRounded: number | null;
      /** Class percentage if the final is a 0. */
      floor: number;
      floorRounded: number;
      /** Class percentage if the final is a 100. */
      ceiling: number;
      ceilingRounded: number;
    };

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Score required on the final.
 *
 * The formula uses the entered numbers at full precision. The status uses the
 * needed score after half-up rounding to two decimals, which is the figure
 * the screen shows: 100.00 still counts as possible, and 0.00 counts as
 * already guaranteed.
 */
export function finalExam(input: FinalInput): FinalResult {
  if (!inRange(input.current, 0, 200)) return { status: "invalid", field: "current" };
  if (!inRange(input.finalWeight, 0, 100)) return { status: "invalid", field: "weight" };
  if (!inRange(input.target, 0, 100)) return { status: "invalid", field: "target" };

  const weight = input.finalWeight / 100;
  const floor = input.current * (1 - weight);
  const ceiling = floor + 100 * weight;
  const floorRounded = roundHalfUp(floor, 2);
  const ceilingRounded = roundHalfUp(ceiling, 2);
  const targetRounded = roundHalfUp(input.target, 2);

  if (weight === 0) {
    return {
      status: floorRounded >= targetRounded ? "guaranteed" : "impossible",
      needed: null,
      neededRounded: null,
      floor,
      floorRounded,
      ceiling,
      ceilingRounded,
    };
  }

  const needed = (input.target - floor) / weight;
  const neededRounded = roundHalfUp(needed, 2);
  let status: FinalStatus;
  if (neededRounded <= 0) status = "guaranteed";
  else if (neededRounded > 100) status = "impossible";
  else status = "need";

  return {
    status,
    needed,
    neededRounded,
    floor,
    floorRounded,
    ceiling,
    ceilingRounded,
  };
}
