import { ELEMENT_BY_SYMBOL } from '../data/elements';
import { POLYATOMIC_IONS } from '../data/ions';
import { bondCapacity, gcdOf, isMetal } from '../utils/chemistry';
import type { Compound } from '../models';
import { parseFormula } from './formula-parser';

export interface BinaryPrediction { formula: string; cation: string; anion: string; cationCharge: number; anionCharge: number; counts: Record<string, number> }

/**
 * FORMULA GENERATION (not reaction simulation).
 * The anion is the element whose most common oxidation state is negative; the cation is the other
 * element's most common (positive) state. Subscripts are the smallest whole numbers that make the
 * total charge zero (crossing charges, then dividing by the GCD).
 * This predicts a *plausible formula* only — it says nothing about whether a reaction really occurs.
 */
export function predictBinary(a: string, b: string): BinaryPrediction | null {
  const first = (s: string) => ELEMENT_BY_SYMBOL[s].commonOxidationStates[0];
  const anion = [a, b].find((s) => first(s) < 0);
  const cation = [a, b].find((s) => s !== anion && first(s) > 0);
  if (!anion || !cation) return null;
  const qc = first(cation), qa = Math.abs(first(anion));
  const g = gcdOf(qc, qa);
  const nCation = qa / g, nAnion = qc / g;
  const sub = (s: string, n: number) => `${s}${n === 1 ? '' : n}`;
  return {
    formula: sub(cation, nCation) + sub(anion, nAnion), cation, anion, cationCharge: qc, anionCharge: -qa,
    counts: { [cation]: nCation, [anion]: nAnion },
  };
}

export interface Ion { formula: string; name: string; charge: number }

/** Parse 'Ca:2', 'Cl:-1' (monatomic, charge required) or 'OH', 'SO4' (polyatomic, charge from the ion table). */
export function parseIon(token: string): Ion {
  const [formula, q] = token.split(':');
  const poly = POLYATOMIC_IONS[formula];
  if (poly) return { formula, name: poly.name, charge: poly.charge };
  return { formula, name: ELEMENT_BY_SYMBOL[formula].name.toLowerCase(), charge: Number(q) };
}

/**
 * FORMULA GENERATION for ionic compounds, including polyatomic ions.
 * Smallest whole-number counts that make total charge zero; a polyatomic ion needed more than once
 * gets parentheses, e.g. Ca²⁺ + 2 OH⁻ → Ca(OH)2 and 2 Al³⁺ + 3 SO₄²⁻ → Al2(SO4)3.
 */
export function ionicFormula(cat: Ion, an: Ion): { formula: string; nCat: number; nAn: number } {
  const g = gcdOf(cat.charge, an.charge);
  const nCat = Math.abs(an.charge) / g, nAn = Math.abs(cat.charge) / g;
  const part = (f: string, n: number) => (n === 1 ? f : (f.match(/[A-Z]/g) ?? []).length > 1 ? `(${f})${n}` : `${f}${n}`);
  return { formula: part(cat.formula, nCat) + part(an.formula, nAn), nCat, nAn };
}

/** "Why does this form?" — built from structured element data, never from free text generation. */
export function explainFormation(c: Compound): string[] {
  if (c.ions) {
    const [cat, an] = c.ions.map(parseIon);
    const { formula, nCat, nAn } = ionicFormula(cat, an);
    if (JSON.stringify(parseFormula(formula)) === JSON.stringify(parseFormula(c.formula)) || formula === c.formula) {
      const q = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);
      const poly = [cat, an].some((i) => POLYATOMIC_IONS[i.formula]);
      return [
        `The ${cat.name} ion has a charge of ${q(cat.charge)} and the ${an.name} ion has a charge of ${q(an.charge)}.`,
        `The charges balance with ${nCat} ${cat.name} and ${nAn} ${an.name} ion${nAn > 1 ? 's' : ''}: ${nCat} × (${q(cat.charge)}) + ${nAn} × (${q(an.charge)}) = 0, which gives ${formula}.`,
        `Oppositely charged ions attract, so the compound is held together by ionic bonds.${poly ? ' Atoms inside a polyatomic ion are bonded covalently.' : ''}`,
      ];
    }
  }
  const syms = c.atoms.map((a) => a.symbol);
  const name = (s: string) => ELEMENT_BY_SYMBOL[s].name;
  const counts = parseFormula(c.formula);
  const n = (s: string) => counts[s];
  if (syms.length === 2) {
    const p = predictBinary(syms[0], syms[1]);
    if (p && p.counts[p.cation] === n(p.cation) && p.counts[p.anion] === n(p.anion)) {
      const ionic = isMetal(p.cation) && !isMetal(p.anion);
      const sum = `${n(p.cation)} × (+${p.cationCharge}) + ${n(p.anion)} × (${p.anionCharge}) = 0`;
      return [
        `${name(p.cation)} commonly has an oxidation state of +${p.cationCharge} and ${name(p.anion).toLowerCase()} commonly has ${p.anionCharge}.`,
        `The charges balance when ${n(p.cation)} ${name(p.cation).toLowerCase()} atom${n(p.cation) > 1 ? 's' : ''} combine with ${n(p.anion)} ${name(p.anion).toLowerCase()} atom${n(p.anion) > 1 ? 's' : ''}: ${sum}.`,
        ionic ? 'The metal gives up electrons to the nonmetal, so the compound is held together by ionic bonds.' : 'The atoms share electrons, so the compound is held together by covalent bonds.',
      ];
    }
  }
  const g = c.geometry;
  if (g) {
    const t = Object.keys(counts).find((s) => s !== g.center)!;
    const cc = bondCapacity(g.center), tc = bondCapacity(t), k = counts[t], order = g.bondOrder ?? 1;
    const lines = [`${name(g.center)} commonly forms ${cc} bond${cc > 1 ? 's' : ''}, while ${name(t).toLowerCase()} commonly forms ${tc}.`];
    lines.push(cc === k * tc * Math.max(1, Math.floor(order))
      ? `${k} ${name(t).toLowerCase()} atom${k > 1 ? 's' : ''} use up all of ${name(g.center).toLowerCase()}'s bonds, giving ${c.formula}.`
      : `Simple bond counting only approximates ${c.formula}; its real bonding is more complex (the formula comes from recorded data).`);
    return lines;
  }
  return [`${c.formula} is recorded in the ChemSim compound database. Simple oxidation-state arithmetic cannot explain this formula on its own.`];
}
