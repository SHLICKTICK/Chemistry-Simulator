import { ELEMENT_BY_SYMBOL } from '../data/elements';
import type { AmountUnit } from '../models';
import { elementalForm } from '../utils/chemistry';
import { parseFormula } from './formula-parser';

/**
 * Every amount is converted through "moles of atoms":
 *   atoms → used as-is (a count of atoms equals the same number of mol of atoms for ratio purposes)
 *   mol   → moles of the element as it exists: 1 mol H2 is 2 mol H atoms, 1 mol Na is 1 mol Na atoms
 *   g     → grams ÷ atomic mass
 */
export const atomsPerFormUnit = (symbol: string): number => parseFormula(elementalForm(symbol))[symbol];

export function toAtomMoles(symbol: string, value: number, unit: AmountUnit): number {
  if (unit === 'atoms') return value;
  if (unit === 'mol') return value * atomsPerFormUnit(symbol);
  return value / ELEMENT_BY_SYMBOL[symbol].atomicMass;
}

export function fromAtomMoles(symbol: string, atomMoles: number, unit: AmountUnit): number {
  if (unit === 'atoms') return atomMoles;
  if (unit === 'mol') return atomMoles / atomsPerFormUnit(symbol);
  return atomMoles * ELEMENT_BY_SYMBOL[symbol].atomicMass;
}

/** Convert an amount between units, preserving the physical quantity. */
export function convertAmount(symbol: string, value: number, from: AmountUnit, to: AmountUnit): number {
  return from === to ? value : Number(fromAtomMoles(symbol, toAtomMoles(symbol, value, from), to).toPrecision(6));
}
