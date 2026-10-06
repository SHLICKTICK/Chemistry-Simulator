import { describe, expect, it } from 'vitest';
import { COMPOUNDS } from '../data/compounds';
import { COMPOUND_PHASE, ELEMENT_PHASE } from '../data/phase-data';
import { ELEMENTS } from '../data/elements';
import { compoundStateAt, elementStateAt } from './phase';
import { combine } from './reaction-engine';

describe('state of matter by temperature', () => {
  it.each([['H2O', -5, 'Solid'], ['H2O', 25, 'Liquid'], ['H2O', 100, 'Gas'], ['H2O', 500, 'Gas'], ['NaCl', 25, 'Solid'], ['NaCl', 900, 'Liquid'], ['NaCl', 1500, 'Gas'],
    ['NH3', 25, 'Gas'], ['NH3', -50, 'Liquid'], ['NH3', -100, 'Solid']])('%s at %i °C is %s', (f, t, s) => expect(compoundStateAt(f, t)?.state).toBe(s));

  it.each([['Hg', 25, 'Liquid'], ['Br', 25, 'Liquid'], ['Na', 25, 'Solid'], ['Na', 100, 'Liquid'], ['Na', 900, 'Gas'], ['Cl', 25, 'Gas'], ['He', 25, 'Gas'],
    ['C', 25, 'Solid'], ['S', 25, 'Solid'], ['S', 150, 'Liquid'], ['Sn', 25, 'Solid'], ['Fe', 1000, 'Solid'], ['Fe', 2000, 'Liquid']])('%s at %i °C is %s', (s, t, st) =>
    expect(elementStateAt(s, t)?.state).toBe(st));

  it('handles sublimation: CO2 and NH4Cl go straight from solid to gas', () => {
    expect(compoundStateAt('CO2', -100)?.state).toBe('Solid');
    expect(compoundStateAt('CO2', -70)?.state).toBe('Gas');
    expect(compoundStateAt('NH4Cl', 25)?.state).toBe('Solid');
    expect(compoundStateAt('NH4Cl', 400)?.state).toBe('Gas');
  });
  it('reports decomposition instead of inventing a melting point', () => {
    expect(compoundStateAt('CaCO3', 25)?.state).toBe('Solid');
    const hot = compoundStateAt('CaCO3', 900);
    expect(hot?.state).toBe('Decomposes');
    expect(hot?.note).toContain('CaO');
  });
  it('returns null for elements with no usable data', () => expect(elementStateAt('Og', 25)).toBeNull());
});

describe('phase data integrity', () => {
  it('every compound state listed in the database matches the computed state at 25 °C', () => {
    for (const c of COMPOUNDS) expect(compoundStateAt(c.formula, 25)?.state, c.formula).toBe(c.state);
  });
  it('covers every element and every compound', () => {
    ELEMENTS.forEach((e) => expect(ELEMENT_PHASE[e.symbol], e.symbol).toBeDefined());
    COMPOUNDS.forEach((c) => expect(COMPOUND_PHASE[c.formula], c.formula).toBeDefined());
  });
  it('every element with data is solid, liquid or gas at 25 °C consistent with common knowledge', () => {
    const gases = ['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn'].filter((s) => ELEMENT_PHASE[s]);
    gases.forEach((s) => expect(elementStateAt(s, 25)?.state, s).toBe('Gas'));
    expect(['Br', 'Hg'].map((s) => elementStateAt(s, 25)?.state)).toEqual(['Liquid', 'Liquid']);
  });
});

describe('state in reaction results', () => {
  it('water formed at its recommended temperature is steam, and says so', () => {
    const r = combine({ H: 2, O: 1 });
    expect(r.state).toBe('Liquid'); // standard state at 25 °C
    expect(r.stateAtConditions).toMatchObject({ temperature: 500, state: 'Gas' });
  });
  it('shows no extra state line at 25 °C', () => expect(combine({ Na: 1, Cl: 1 }).stateAtConditions).toBeUndefined());
  it('uses the temperature you set', () => {
    expect(combine({ Na: 1, Cl: 1 }, { temperature: 900, pressure: 1 }).stateAtConditions?.state).toBe('Liquid');
    expect(combine({ Na: 1, Cl: 1 }, { temperature: 1500, pressure: 1 }).stateAtConditions?.state).toBe('Gas');
  });
  it('reports the states of the starting elements at that temperature', () => {
    const cold = combine({ Na: 1, Cl: 1 }).reactantStates!;
    expect(cold.map((x) => [x.symbol, x.state])).toEqual([['Na', 'Solid'], ['Cl', 'Gas']]);
    const warm = combine({ Na: 1, Cl: 1 }, { temperature: 120, pressure: 1 }).reactantStates!;
    expect(warm.find((x) => x.symbol === 'Na')?.state).toBe('Liquid');
  });
  it('warns that pressure is not modelled when it is far from 1 atm', () => {
    const r = combine({ Na: 1, Cl: 1 }, { temperature: 900, pressure: 50 });
    expect(r.stateAtConditions?.note).toMatch(/pressure is not modelled/);
  });
});
