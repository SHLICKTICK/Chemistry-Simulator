import { ELEMENT_BY_SYMBOL } from '../data/elements';
import type { AmountUnit } from '../models';

export const MAX_QUANTITY = 99;

export const UNIT_LIMITS: Record<AmountUnit, { min: number; max: number; step: number }> = {
  atoms: { min: 1, max: MAX_QUANTITY, step: 1 },
  mol: { min: 0.01, max: 1000, step: 0.5 },
  g: { min: 0.01, max: 10000, step: 1 },
};

/** Clamp an entered amount into its unit's range (whole numbers for atoms, 6 significant digits otherwise). */
export function clampAmount(unit: AmountUnit, v: number): number {
  const { min, max } = UNIT_LIMITS[unit];
  const x = Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
  return unit === 'atoms' ? Math.round(x) : Number(x.toPrecision(6));
}

/** Returns a user-facing error message, or null when the input is valid. `continuous` = real-number amounts (mol of atoms). */
export function validateReactants(input: Record<string, number>, continuous = false): string | null {
  const entries = Object.entries(input);
  if (entries.length === 0) return 'No elements were selected. Pick at least one element to start.';
  for (const [sym, q] of entries) {
    if (!ELEMENT_BY_SYMBOL[sym]) return `"${sym}" is not an element in the ChemSim database.`;
    const name = ELEMENT_BY_SYMBOL[sym].name;
    if (continuous) {
      if (!Number.isFinite(q) || q <= 0 || q > 1e6) return `Amount for ${name} must be a positive number.`;
    } else if (!Number.isInteger(q) || q < 1 || q > MAX_QUANTITY) return `Quantity for ${name} must be a whole number from 1 to ${MAX_QUANTITY}.`;
  }
  return null;
}
