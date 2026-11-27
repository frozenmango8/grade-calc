import { roundHalfUp } from "../math/round";

export function formatFixed(value: number, places: number): string {
  return roundHalfUp(value, places).toFixed(places);
}

/** Fixed decimals with trailing zeros removed: 90.00 becomes 90, 90.50 becomes 90.5. */
export function formatTrimmed(value: number, places: number): string {
  const fixed = formatFixed(value, places);
  if (!fixed.includes(".")) return fixed;
  return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
