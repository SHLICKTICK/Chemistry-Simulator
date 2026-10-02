import { describe, expect, it } from 'vitest';
import { predictBinary } from './compound-builder';
import { balance, formatEquation, isBalanced } from './equation-balancer';
import { molarMassOf, parseFormula } from './formula-parser';
import { combine } from './reaction-engine';

describe('combine()', () => {
  it.each([
    [{ H: 2, O: 1 }, 'H2O', 18.015, 'Water'],
    [{ Na: 1, Cl: 1 }, 'NaCl', 58.44, 'Sodium Chloride'],
    [{ C: 1, O: 2 }, 'CO2', 44.009, 'Carbon Dioxide'],
    [{ N: 1, H: 3 }, 'NH3', 17.031, 'Ammonia'],
    [{ Ca: 1, Cl: 2 }, 'CaCl2', 110.978, 'Calcium Chloride'],
    [{ H: 4, O: 2 }, 'H2O', 18.015, 'Water'], // same ratio, scaled
  ])('%j → %s', (input, formula, mass, name) => {
    const r = combine(input);
    expect(r.success).toBe(true);
    expect(r.formula).toBe(formula);
    expect(r.molarMass).toBeCloseTo(mass, 3);
    expect(r.name).toBe(name);
  });

  it('returns the balanced equation and molecule for water', () => {
    const r = combine({ H: 2, O: 1 });
    expect(r.equation).toBe('2H2 + O2 → 2H2O');
    expect(r.basis).toBe('known-reaction');
    expect(r.molecule?.atoms.map((a) => a.element)).toEqual(['O', 'H', 'H']);
    expect(r.atoms?.map((a) => [a.symbol, a.count])).toEqual([['O', 1], ['H', 2]]);
  });

  it('rejects invalid combinations with useful feedback', () => {
    const wrong = combine({ H: 1, O: 3 });
    expect(wrong.success).toBe(false);
    expect(wrong.suggestions?.[0]).toContain('H2O');
    expect(combine({ C: 1, O: 3 }).suggestions?.join()).toContain('Carbon Dioxide');
    expect(combine({ C: 1, O: 3 }).suggestions?.join()).toContain('Carbon Monoxide');
    expect(combine({ H: 1 }).success).toBe(false);
    expect(combine({}).success).toBe(false);
  });

  it('validates quantities', () => {
    expect(combine({ H: 0, O: 1 }).error).toMatch(/whole number/);
    expect(combine({ H: 1.5, O: 1 }).success).toBe(false);
    expect(combine({ H: 2, Xx: 1 }).error).toMatch(/not an element/);
  });

  it('never reports an unrecorded formula as a result', () => {
    const r = combine({ Na: 1, O: 1 });
    expect(r.success).toBe(false);
    expect(r.predictedFormula).toBe('Na2O');
  });
});

describe('formula generation (charge balancing)', () => {
  it.each([['Na', 'Cl', 'NaCl'], ['Ca', 'Cl', 'CaCl2'], ['H', 'O', 'H2O'], ['Al', 'O', 'Al2O3']])('%s + %s → %s', (a, b, f) => {
    expect(predictBinary(a, b)?.formula).toBe(f);
  });
  it('balances total charge to zero', () => {
    const p = predictBinary('Al', 'O')!;
    expect(p.counts[p.cation] * p.cationCharge + p.counts[p.anion] * p.anionCharge).toBe(0);
  });
});

describe('formula parser', () => {
  it('counts atoms incl. parentheses', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 });
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(() => parseFormula('Xx2')).toThrow();
  });
  it('computes molar mass', () => expect(molarMassOf(parseFormula('H2SO4'))).toBeCloseTo(98.07, 2));
});

describe('equation balancer', () => {
  it('H2 + O2 → H2O', () => {
    const c = balance(['H2', 'O2'], ['H2O'])!;
    expect(c).toEqual([2, 1, 2]);
    expect(formatEquation(['H2', 'O2'], ['H2O'], c)).toBe('2H2 + O2 → 2H2O');
    expect(isBalanced({ H2: 2, O2: 1 }, { H2O: 2 })).toBe(true);
  });
  it('handles harder equations', () => {
    expect(balance(['C3H8', 'O2'], ['CO2', 'H2O'])).toEqual([1, 5, 3, 4]);
    expect(balance(['Fe', 'O2'], ['Fe2O3'])).toEqual([4, 3, 2]);
  });
  it('returns null for impossible equations', () => expect(balance(['H2'], ['O2'])).toBeNull());
});

describe('reaction conditions', () => {
  const haber = { N: 1, H: 3 };
  it('uses recommended conditions by default', () => expect(combine(haber).success).toBe(true));
  it('blocks a recorded reaction when conditions are too mild', () => {
    const r = combine(haber, { temperature: 25, pressure: 1 });
    expect(r.success).toBe(false);
    expect(r.recognisedEquation).toBe('N2 + 3H2 → 2NH3');
    expect(r.suggestions).toHaveLength(3); // temperature, pressure, catalyst
  });
  it('allows it when every requirement is met', () =>
    expect(combine(haber, { temperature: 450, pressure: 200, catalyst: 'Fe' }).success).toBe(true));
  it('needs ignition for hydrogen + oxygen', () => {
    expect(combine({ H: 2, O: 1 }, { temperature: 25, pressure: 1 }).success).toBe(false);
    expect(combine({ H: 2, O: 1 }, { temperature: 600, pressure: 1 }).success).toBe(true);
  });
});
