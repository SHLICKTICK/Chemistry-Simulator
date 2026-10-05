import { describe, expect, it } from 'vitest';
import { convertAmount, toAtomMoles } from './amounts';
import { combine } from './reaction-engine';
import { validateReactants } from '../utils/validation';

describe('unit conversion', () => {
  it('grams → moles of atoms', () => {
    expect(toAtomMoles('H', 2.016, 'g')).toBeCloseTo(2, 6);
    expect(toAtomMoles('Na', 22.99, 'g')).toBeCloseTo(1, 6);
  });
  it('moles are of the element as it exists: 1 mol H2 = 2 mol H atoms, 1 mol Na = 1 mol atoms', () => {
    expect(toAtomMoles('H', 1, 'mol')).toBe(2);
    expect(toAtomMoles('Cl', 1, 'mol')).toBe(2);
    expect(toAtomMoles('Na', 1, 'mol')).toBe(1);
  });
  it('preserves the physical amount when switching units', () => {
    expect(convertAmount('H', 2, 'atoms', 'g')).toBeCloseTo(2.016, 3);
    expect(convertAmount('H', 2, 'atoms', 'mol')).toBe(1);
    expect(convertAmount('O', 31.998, 'g', 'mol')).toBeCloseTo(1, 4); // 1 mol O2
    expect(convertAmount('H', convertAmount('H', 5, 'g', 'mol'), 'mol', 'g')).toBeCloseTo(5, 4);
  });
});

describe('combining by mass and moles', () => {
  const run = (a: Record<string, number>, unit: 'g' | 'mol') =>
    combine(Object.fromEntries(Object.entries(a).map(([e, v]) => [e, toAtomMoles(e, v, unit)])), null, { continuous: true });

  it('stoichiometric masses give exactly one water-worth of product and no leftovers', () => {
    const r = run({ H: 2.016, O: 15.999 }, 'g');
    expect(r.formula).toBe('H2O');
    expect(r.productGrams).toBeCloseTo(18.015, 2);
    expect(r.leftovers).toEqual([]);
    expect(r.amount).toBeCloseTo(1, 6);
  });
  it('finds the limiting reagent by mass: 4 g H + 32 g O', () => {
    const r = run({ H: 4, O: 32 }, 'g');
    expect(r.limiting?.symbol).toBe('H');
    expect(r.leftovers?.[0].symbol).toBe('O');
    expect(r.productGrams).toBeCloseTo(35.7, 1); // 4 g H makes 4/2.016 mol of H2O
  });
  it('conserves mass: product + leftovers = what you put in', () => {
    const inputs: Record<string, number>[] = [{ H: 4, O: 32 }, { H: 10, O: 10 }, { C: 3, O: 20 }, { N: 14, H: 6 }, { Na: 10, Cl: 10 }];
    for (const input of inputs) {
      const r = run(input, 'g');
      expect(r.success, JSON.stringify(input)).toBe(true);
      const out = r.productGrams! + (r.leftovers ?? []).reduce((s, l) => s + l.grams!, 0);
      expect(out, JSON.stringify(input)).toBeCloseTo(Object.values(input).reduce((s, g) => s + g, 0), 1);
    }
  });
  it('accepts moles of elemental forms: 2 mol H2 + 1 mol O2 → 2 mol H2O', () => {
    const r = run({ H: 2, O: 1 }, 'mol');
    expect(r.amount).toBeCloseTo(2, 6);
    expect(r.productGrams).toBeCloseTo(36.03, 1);
    expect(r.leftovers).toEqual([]);
  });
  it('scales heat to your amounts', () => {
    const r = run({ H: 2, O: 1 }, 'mol'); // 2 mol H2O at −285.8 kJ/mol
    expect(r.enthalpy?.forAmount).toBeCloseTo(-571.6, 1);
    expect(combine({ H: 2, O: 1 }).enthalpy?.forAmount).toBeUndefined(); // atoms mode: no bulk scaling
  });
  it('still applies conditions in grams mode', () => {
    const r = combine({ N: 1, H: 3 }, { temperature: 25, pressure: 1 }, { continuous: true });
    expect(r.success).toBe(false);
    expect(r.recognisedEquation).toContain('⇌');
  });
  it('validates real-number amounts', () => {
    expect(validateReactants({ H: 0.5, O: 0.25 }, true)).toBeNull();
    expect(validateReactants({ H: 0, O: 1 }, true)).toMatch(/positive/);
    expect(validateReactants({ H: -1, O: 1 }, true)).toMatch(/positive/);
    expect(validateReactants({ H: 0.5, O: 1 }, false)).toMatch(/whole number/);
  });
});
