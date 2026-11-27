import { roundHalfUp } from "./round";

export interface LetterScale {
  a: number;
  b: number;
  c: number;
  d: number;
  plusMinus: boolean;
}

export interface LetterCut {
  letter: string;
  /** Minimum percentage, already rounded half up to two decimals. */
  min: number;
}

export const DEFAULT_SCALE: LetterScale = {
  a: 90,
  b: 80,
  c: 70,
  d: 60,
  plusMinus: false,
};

export function isValidScale(scale: LetterScale): boolean {
  const { a, b, c, d } = scale;
  return (
    [a, b, c, d].every((cut) => Number.isFinite(cut)) &&
    d >= 0 &&
    d < c &&
    c < b &&
    b < a &&
    a <= 100
  );
}

/**
 * Letter thresholds from highest to lowest.
 *
 * Plus and minus split the span from one cutoff to the next into equal thirds.
 * The A span runs to 100. Each boundary is rounded half up to two decimals so
 * the printed cutoff and the grade decision use the same number. A higher
 * letter wins when rounding makes two boundaries land on the same percent.
 */
export function letterCuts(scale: LetterScale): LetterCut[] | null {
  if (!isValidScale(scale)) return null;

  const bands = [
    { letter: "A", low: scale.a, high: 100 },
    { letter: "B", low: scale.b, high: scale.a },
    { letter: "C", low: scale.c, high: scale.b },
    { letter: "D", low: scale.d, high: scale.c },
  ];

  const cuts: LetterCut[] = [];
  for (const band of bands) {
    if (!scale.plusMinus) {
      cuts.push({ letter: band.letter, min: roundHalfUp(band.low, 2) });
      continue;
    }
    const span = band.high - band.low;
    const steps = [
      { suffix: "+", at: band.low + (span * 2) / 3 },
      { suffix: "", at: band.low + span / 3 },
      { suffix: "-", at: band.low },
    ];
    for (const step of steps) {
      cuts.push({
        letter: `${band.letter}${step.suffix}`,
        min: roundHalfUp(step.at, 2),
      });
    }
  }
  return cuts;
}

/**
 * Letter for a percentage. The percentage is rounded half up to two decimals
 * before it is compared with the cutoffs. Returns null when the scale is
 * unusable or the percentage is not a finite number.
 */
export function letterFor(percent: number, scale: LetterScale): string | null {
  if (!Number.isFinite(percent)) return null;
  const cuts = letterCuts(scale);
  if (!cuts) return null;

  const rounded = roundHalfUp(percent, 2);
  for (const cut of cuts) {
    if (rounded >= cut.min) return cut.letter;
  }
  return "F";
}
