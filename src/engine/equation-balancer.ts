import { parseFormula } from './formula-parser';

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

/**
 * Balance an equation by conservation of atoms.
 * Builds the element × species matrix (products negative) and finds its null space with
 * integer-only Gaussian elimination, so no floating-point rounding can creep in.
 * Returns smallest whole-number coefficients, or null if there is no unique balanced solution.
 */
export function balance(reactants: string[], products: string[]): number[] | null {
  const species = [...reactants, ...products];
  const parsed = species.map(parseFormula);
  const elements = [...new Set(parsed.flatMap((p) => Object.keys(p)))];
  const rows = elements.map((e) => parsed.map((p, i) => (p[e] ?? 0) * (i < reactants.length ? 1 : -1)));
  const n = species.length;
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < rows.length; c++) {
    const p = rows.findIndex((row, i) => i >= r && row[c] !== 0);
    if (p < 0) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    for (let i = 0; i < rows.length; i++) {
      if (i === r || rows[i][c] === 0) continue;
      const a = rows[r][c], b = rows[i][c];
      rows[i] = rows[i].map((v, j) => v * a - rows[r][j] * b);
      const g = rows[i].reduce((x, y) => gcd(x, y), 0) || 1;
      rows[i] = rows[i].map((v) => v / g);
    }
    pivots.push(c);
    r++;
  }
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c));
  if (free.length !== 1) return null; // none → only trivial solution; >1 → ambiguous
  const f = free[0];
  // Pivot variable x_p = -row[f] / row[p] * x_f, kept as reduced fractions.
  const fr = pivots.map((p, k) => {
    let num = -rows[k][f], den = rows[k][p];
    if (den < 0) { num = -num; den = -den; }
    const g = gcd(num, den) || 1;
    return [num / g, den / g];
  });
  const d = fr.reduce((acc, [, den]) => lcm(acc, den), 1);
  const coef = Array<number>(n).fill(0);
  coef[f] = d;
  pivots.forEach((p, k) => { coef[p] = (fr[k][0] * d) / fr[k][1]; });
  const sign = coef.some((x) => x < 0) ? -1 : 1;
  const out = coef.map((x) => x * sign);
  if (out.some((x) => x <= 0)) return null;
  const g = out.reduce((x, y) => gcd(x, y), 0);
  return out.map((x) => x / g);
}

/** Format "2H2 + O2 → 2H2O" (coefficient 1 omitted). */
export function formatEquation(reactants: string[], products: string[], coefs: number[]): string {
  const side = (fs: string[], offset: number) => fs.map((f, i) => `${coefs[offset + i] === 1 ? '' : coefs[offset + i]}${f}`).join(' + ');
  return `${side(reactants, 0)} → ${side(products, reactants.length)}`;
}

export function isBalanced(reactants: Record<string, number>, products: Record<string, number>): boolean {
  const tally = (side: Record<string, number>) => {
    const t: Record<string, number> = {};
    for (const [f, k] of Object.entries(side)) for (const [e, n] of Object.entries(parseFormula(f))) t[e] = (t[e] ?? 0) + n * k;
    return t;
  };
  const a = tally(reactants), b = tally(products);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => a[k] === b[k]);
}
