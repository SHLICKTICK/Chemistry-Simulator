import { describe, expect, it } from 'vitest';
import { COMPOUND_BY_FORMULA } from '../data/compounds';
import { REACTIONS } from '../data/reactions';
import { FORMATION_ENTHALPY } from '../data/thermo';
import { balance } from './equation-balancer';
import { combine } from './reaction-engine';
import { reactionEnthalpy } from './thermo';

describe('limiting reagent and leftovers', () => {
  it('H:5 + O:1 makes one water and leaves 3 hydrogen', () => {
    const r = combine({ H: 5, O: 1 });
    expect(r.formula).toBe('H2O');
    expect(r.amount).toBe(1);
    expect(r.leftovers).toEqual([{ symbol: 'H', name: 'Hydrogen', count: 3 }]);
    expect(r.limiting?.symbol).toBe('O');
  });
  it('scales exact multiples with nothing left over', () => {
    const r = combine({ H: 4, O: 2 });
    expect(r.amount).toBe(2);
    expect(r.leftovers).toEqual([]);
    expect(r.limiting).toBeUndefined();
  });
  it('conserves atoms: made + leftover equals what you put in', () => {
    const input = { C: 1, O: 3 };
    const r = combine(input);
    expect(r.formula).toBe('CO2'); // plenty of oxygen → CO2, with 1 O left over
    expect(r.leftovers).toEqual([{ symbol: 'O', name: 'Oxygen', count: 1 }]);
    expect(r.amount! * 2 + 1).toBe(input.O);
  });
  it('picks carbon monoxide when oxygen is scarce', () => {
    const r = combine({ C: 3, O: 1 });
    expect(r.formula).toBe('CO');
    expect(r.leftovers).toEqual([{ symbol: 'C', name: 'Carbon', count: 2 }]);
  });
  it('still applies the conditions check when there are leftovers', () => {
    expect(combine({ N: 2, H: 7 }, { temperature: 25, pressure: 1 }).success).toBe(false);
    expect(combine({ N: 2, H: 7 }).leftovers?.[0]).toMatchObject({ symbol: 'H', count: 1 });
  });
});

describe('heat of reaction (from tabulated enthalpies of formation)', () => {
  it('water formation is strongly exothermic', () => {
    const e = combine({ H: 2, O: 1 }).enthalpy!;
    expect(e.total).toBeCloseTo(-571.6, 1);
    expect(e.perMoleProduct).toBeCloseTo(-285.8, 1);
    expect(e.kind).toBe('exothermic');
  });
  it('burning carbon releases the enthalpy of formation of CO2', () => expect(combine({ C: 1, O: 2 }).enthalpy?.total).toBeCloseTo(-393.5, 1));
  it('nitrogen dioxide formation absorbs heat', () => expect(combine({ N: 1, O: 2 }).enthalpy?.kind).toBe('endothermic'));
  it('returns undefined rather than guessing when data is missing', () => expect(reactionEnthalpy(['H2'], ['C2H6'], [1, 1])).toBeUndefined());
  it('compounds with no recorded reaction have no heat claim', () => expect(combine({ Na: 1, O: 1, H: 1 }).enthalpy).toBeUndefined());
});

describe('lab notes data', () => {
  it('every recorded reaction has observations, a known product enthalpy and a hazard level that is valid', () => {
    for (const r of REACTIONS) {
      const label = Object.keys(r.products).join();
      expect(r.observations?.length, label).toBeGreaterThan(0);
      Object.keys(r.products).forEach((p) => expect(FORMATION_ENTHALPY[p], p).toBeTypeOf('number'));
      if (r.hazard) expect(['caution', 'danger']).toContain(r.hazard.level);
      expect(reactionEnthalpy(Object.keys(r.reactants), Object.keys(r.products), balance(Object.keys(r.reactants), Object.keys(r.products))!), label).toBeDefined();
    }
  });
  it('marks the Haber process as reversible', () => {
    const r = combine({ N: 1, H: 3 });
    expect(r.reversible).toBe(true);
    expect(r.equation).toContain('⇌');
  });
  it('only reactions with a stored compound get lab notes', () => expect(COMPOUND_BY_FORMULA.NH3).toBeDefined());
});
