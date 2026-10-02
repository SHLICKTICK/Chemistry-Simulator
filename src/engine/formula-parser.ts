import { ELEMENT_BY_SYMBOL } from '../data/elements';
import type { AtomCount } from '../models';

/** Parse "Ca(OH)2" → { Ca: 1, O: 2, H: 2 }. Throws on malformed input or unknown elements. */
export function parseFormula(formula: string): Record<string, number> {
  const stack: Record<string, number>[] = [{}];
  const add = (t: Record<string, number>, k: string, n: number) => { t[k] = (t[k] ?? 0) + n; };
  const re = /([A-Z][a-z]?)(\d*)|(\()|\)(\d*)/g;
  let consumed = 0, m: RegExpExecArray | null;
  while ((m = re.exec(formula))) {
    consumed += m[0].length;
    if (m[1]) {
      if (!ELEMENT_BY_SYMBOL[m[1]]) throw new Error(`Unknown element "${m[1]}"`);
      add(stack[stack.length - 1], m[1], Number(m[2] || 1));
    } else if (m[3]) stack.push({});
    else {
      if (stack.length < 2) throw new Error('Unbalanced parentheses');
      const group = stack.pop()!;
      for (const k of Object.keys(group)) add(stack[stack.length - 1], k, group[k] * Number(m[4] || 1));
    }
  }
  if (consumed !== formula.length || stack.length !== 1) throw new Error(`Cannot parse formula "${formula}"`);
  return stack[0];
}

export function molarMassOf(counts: Record<string, number>): number {
  const total = Object.entries(counts).reduce((s, [sym, n]) => s + ELEMENT_BY_SYMBOL[sym].atomicMass * n, 0);
  return Number(total.toFixed(3));
}

export const atomsOf = (counts: Record<string, number>): AtomCount[] =>
  Object.entries(counts).map(([symbol, count]) => ({ symbol, count }));
