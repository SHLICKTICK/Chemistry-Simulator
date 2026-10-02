import { ELEMENT_BY_SYMBOL } from '../data/elements';

export const MAX_QUANTITY = 99;

/** Returns a user-facing error message, or null when the input is valid. */
export function validateReactants(input: Record<string, number>): string | null {
  const entries = Object.entries(input);
  if (entries.length === 0) return 'No elements were selected. Pick at least one element to start.';
  for (const [sym, q] of entries) {
    if (!ELEMENT_BY_SYMBOL[sym]) return `"${sym}" is not an element in the ChemSim database.`;
    if (!Number.isInteger(q) || q < 1 || q > MAX_QUANTITY)
      return `Quantity for ${ELEMENT_BY_SYMBOL[sym].name} must be a whole number from 1 to ${MAX_QUANTITY}.`;
  }
  return null;
}
