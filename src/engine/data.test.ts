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
    expect(new Set(ELEMENTS.map((e) => `${e.row}:${e.col}`)).size).toBe(ELEMENTS.length);
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

describe('all 118 elements', () => {
  it('covers atomic numbers 1–118 in order', () => {
    expect(ELEMENTS).toHaveLength(118);
    ELEMENTS.forEach((e, i) => expect(e.atomicNumber).toBe(i + 1));
  });
  it('has sane valence electrons by family', () => {
    for (const e of ELEMENTS) {
      if (e.category === 'alkali') expect(e.valenceElectrons, e.symbol).toBe(1);
      if (e.category === 'alkaline') expect(e.valenceElectrons, e.symbol).toBe(2);
      if (e.category === 'halogen') expect(e.valenceElectrons, e.symbol).toBe(7);
      if (e.category === 'noble') expect(e.valenceElectrons, e.symbol).toBe(e.symbol === 'He' ? 2 : 8);
    }
  });
  it('places the f-block below the main table and every element on the grid', () => {
    const by = Object.fromEntries(ELEMENTS.map((e) => [e.symbol, e]));
    expect([by.Ce.row, by.Ce.col, by.Lu.col, by.Th.row, by.Lr.col]).toEqual([9, 3, 16, 10, 16]);
    expect([by.La.row, by.La.col, by.Ac.row, by.Og.row, by.Og.col]).toEqual([6, 3, 7, 7, 18]);
    ELEMENTS.forEach((e) => { expect(e.row).toBeGreaterThanOrEqual(1); expect(e.col).toBeGreaterThanOrEqual(1); expect(e.col).toBeLessThanOrEqual(18); });
  });
  it('keeps engine-critical oxidation-state ordering', () => {
    const by = Object.fromEntries(ELEMENTS.map((e) => [e.symbol, e]));
    expect(by.Cl.commonOxidationStates[0]).toBe(-1); // anion
    expect(by.Na.commonOxidationStates[0]).toBe(1); // cation
    expect(by.H.commonOxidationStates[0]).toBe(1);
    expect(by.Og.commonOxidationStates).toEqual([0]);
  });
  it('lets the engine handle elements with unknown chemistry without crashing', () => {
    const r = combine({ Og: 1, Fl: 1 });
    expect(r.success).toBe(false);
  });
  it('can still combine newly added elements', () => expect(combine({ Ba: 1, Cl: 2 }).success).toBe(false)); // not in database → honest failure
});
