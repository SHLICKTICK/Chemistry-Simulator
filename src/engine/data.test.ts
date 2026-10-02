import { describe, expect, it } from 'vitest';
import { COMPOUNDS, COMPOUND_BY_FORMULA } from '../data/compounds';
import { ELEMENTS } from '../data/elements';
import { REACTIONS } from '../data/reactions';
import { ionicFormula, parseIon } from './compound-builder';
import { balance, isBalanced } from './equation-balancer';
import { parseFormula } from './formula-parser';
import { combine } from './reaction-engine';

describe('database integrity', () => {
  it('elements: unique numbers, symbols and table positions', () => {
    expect(new Set(ELEMENTS.map((e) => e.atomicNumber)).size).toBe(ELEMENTS.length);
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(ELEMENTS.length);
    expect(new Set(ELEMENTS.map((e) => `${e.period}:${e.group}`)).size).toBe(ELEMENTS.length);
  });
  it('compounds: unique formulas, parseable, positive molar mass', () => {
    expect(new Set(COMPOUNDS.map((c) => c.formula)).size).toBe(COMPOUNDS.length);
    for (const c of COMPOUNDS) { expect(() => parseFormula(c.formula)).not.toThrow(); expect(c.molarMass).toBeGreaterThan(0); }
  });
  it('compounds: ionic formulas match the generator', () => {
    for (const c of COMPOUNDS.filter((x) => x.ions)) {
      const [cat, an] = c.ions!.map(parseIon);
      expect(ionicFormula(cat, an).formula, c.formula).toBe(c.formula);
    }
  });
  it('reactions: balanced as written, products known, balancer agrees', () => {
    for (const r of REACTIONS) {
      const re = Object.keys(r.reactants), pr = Object.keys(r.products), label = `${re} → ${pr}`;
      expect(isBalanced(r.reactants, r.products), label).toBe(true);
      pr.forEach((p) => expect(COMPOUND_BY_FORMULA[p], p).toBeDefined());
      expect(balance(re, pr), label).toEqual([...Object.values(r.reactants), ...Object.values(r.products)]);
    }
  });
  it('every recorded reaction is recognised by the engine', () => {
    for (const r of REACTIONS) {
      const atoms: Record<string, number> = {};
      for (const [f, k] of Object.entries(r.reactants)) for (const [e, n] of Object.entries(parseFormula(f))) atoms[e] = (atoms[e] ?? 0) + n * k;
      expect(combine(atoms).basis, JSON.stringify(r.reactants)).toBe('known-reaction');
    }
  });
});

describe('new chemistry', () => {
  it('generates polyatomic formulas with parentheses', () => {
    expect(ionicFormula(parseIon('Ca:2'), parseIon('OH')).formula).toBe('Ca(OH)2');
    expect(ionicFormula(parseIon('Al:3'), parseIon('SO4')).formula).toBe('Al2(SO4)3');
    expect(ionicFormula(parseIon('NH4'), parseIon('SO4')).formula).toBe('(NH4)2SO4');
  });
  it('recognises hydroxide compositions and explains them with ions', () => {
    const r = combine({ Ca: 1, O: 2, H: 2 });
    expect(r.formula).toBe('Ca(OH)2');
    expect(r.explanation?.join(' ')).toContain('hydroxide');
  });
  it('treats an unrecorded composition ratio as a compound match, not a reaction', () => {
    const r = combine({ H: 1, O: 1 });
    expect(r.formula).toBe('H2O2');
    expect(r.basis).toBe('known-compound');
  });
  it('burns carbon to CO with limited oxygen', () => expect(combine({ C: 1, O: 1 }).formula).toBe('CO'));
});
