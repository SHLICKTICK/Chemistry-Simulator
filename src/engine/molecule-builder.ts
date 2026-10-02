import type { Bond, Compound, Molecule } from '../models';
import { parseFormula } from './formula-parser';

type V3 = [number, number, number];
const L = 1.2; // display bond length (arbitrary units)

/** Build a framework-independent 3D structure from a compound's geometry. Null if no structure data. */
export function buildMolecule(c: Compound): Molecule | null {
  const g = c.geometry;
  if (!g) return null;
  const counts = parseFormula(c.formula);
  if (counts[g.center] !== 1) return null;
  const terminals = Object.entries(counts).filter(([s]) => s !== g.center).flatMap(([s, n]) => Array<string>(n).fill(s));
  let pos: V3[];
  switch (g.shape) {
    case 'linear': pos = terminals.length === 1 ? [[L, 0, 0]] : [[-L, 0, 0], [L, 0, 0]]; break;
    case 'bent': {
      const h = ((g.angle ?? 104.5) * Math.PI) / 360; // half the bond angle
      pos = [[-Math.sin(h) * L, -Math.cos(h) * L, 0], [Math.sin(h) * L, -Math.cos(h) * L, 0]]; break;
    }
    case 'pyramidal':
      pos = [0, 1, 2].map((i) => { const p = (i * 2 * Math.PI) / 3; return [0.94 * L * Math.cos(p), -0.33 * L, 0.94 * L * Math.sin(p)] as V3; }); break;
    case 'tetrahedral':
      pos = ([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] as V3[]).map((v) => v.map((x) => (x * L) / Math.sqrt(3)) as V3); break;
  }
  if (pos.length !== terminals.length) return null;
  const atoms = [{ element: g.center, position: { x: 0, y: 0, z: 0 } },
    ...terminals.map((element, i) => ({ element, position: { x: pos[i][0], y: pos[i][1], z: pos[i][2] } }))];
  const bonds: Bond[] = terminals.map((_, i) => ({ from: 0, to: i + 1, order: g.bondOrder ?? 1 }));
  return { formula: c.formula, atoms, bonds };
}
