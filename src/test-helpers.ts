import { expect } from "vitest";
import { hexToRgb } from "./color-math";

/**
 * Assert two hex colors are close (each RGB channel within tolerance).
 * Useful for round-trip tests where floating point introduces drift.
 */
export function expectCloseHex(actual: string, expected: string, tolerance = 2): void {
  const a = hexToRgb(actual);
  const e = hexToRgb(expected);
  expect(a.r).toBeGreaterThanOrEqual(e.r - tolerance);
  expect(a.r).toBeLessThanOrEqual(e.r + tolerance);
  expect(a.g).toBeGreaterThanOrEqual(e.g - tolerance);
  expect(a.g).toBeLessThanOrEqual(e.g + tolerance);
  expect(a.b).toBeGreaterThanOrEqual(e.b - tolerance);
  expect(a.b).toBeLessThanOrEqual(e.b + tolerance);
}

/** Validate a string is a proper 7-character lowercase hex color. */
export function expectValidHex(value: string): void {
  expect(value).toMatch(/^#[0-9a-f]{6}$/);
}

/** Validate a string is a 9-character hex+alpha (for focused states). */
export function expectValidHexAlpha(value: string): void {
  expect(value).toMatch(/^#[0-9a-f]{6}[0-9a-f]{2}$/);
}
