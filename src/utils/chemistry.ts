import { ELEMENT_BY_SYMBOL } from '../data/elements';
import type { Category } from '../models';

export const isMetal = (sym: string): boolean =>
  (['alkali', 'alkaline', 'transition', 'post-transition', 'lanthanide', 'actinide'] as Category[]).includes(ELEMENT_BY_SYMBOL[sym].category);

const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']);
/** Standard elemental form at room conditions (H → H2, Na → Na). */
export const elementalForm = (sym: string): string => (DIATOMIC.has(sym) ? `${sym}2` : sym);

/** Typical number of covalent bonds an atom forms (octet rule; H = 1). */
export const bondCapacity = (sym: string): number => {
  const v = ELEMENT_BY_SYMBOL[sym].valenceElectrons;
  return v <= 4 ? v : 8 - v;
};

export const gcdOf = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcdOf(b, a % b));

/** True when two atom-count maps describe the same ratio (e.g. {H:4,O:2} ≈ {H:2,O:1}). */
export function sameRatio(a: Record<string, number>, b: Record<string, number>): boolean {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length || ka.some((k) => !(k in b))) return false;
  const k0 = ka[0];
  return ka.every((k) => a[k] * b[k0] === b[k] * a[k0]);
}

/** CPK-style colours tuned for a dark background. */
export const ATOM_COLORS: Record<string, string> = {
  H: '#e8edf5', O: '#e5303a', C: '#7b8494', N: '#3b6cf0', Na: '#a855f7', Cl: '#34c759',
  Ca: '#f59e0b', F: '#84cc16', S: '#eab308', P: '#fb923c',
};
export const atomColor = (sym: string): string => ATOM_COLORS[sym] ?? '#8b97b3';
