/**
 * Round half away from zero to a fixed number of decimal places.
 *
 * `Math.round(value * 100) / 100` mis-rounds decimals such as 1.005 and 9.995,
 * because the scaled product is not exact in binary. Shifting with exponential
 * notation (`${value}e${places}`) rounds the decimal digits we mean. Grade
 * figures stay well inside the range where that shift is exact.
 */
export function roundHalfUp(value: number, places: number): number {
  if (!Number.isFinite(value)) return value;
  if (!Number.isInteger(places) || places < 0) {
    throw new RangeError("places must be a non-negative integer");
  }

  const negative = value < 0;
  const magnitude = Math.abs(value);
  const shifted = Number(`${magnitude}e${places}`);
  if (!Number.isFinite(shifted)) return value;

  const rounded = Math.round(shifted);
  const result = Number(`${rounded}e-${places}`);
  return negative ? -result : result;
}
