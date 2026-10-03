import { describe, expect, it } from 'vitest';
import { ELEMENTS } from '../data/elements';
import { getAtomicStructure } from './atomic-structure';

const at = (s: string) => getAtomicStructure(s)!;

describe('atomic structure', () => {
  it.each([
    ['H', 1, 0], ['He', 2, 2], ['Na', 11, 12], ['Cl', 17, 18], ['Fe', 26, 30], ['Cu', 29, 34], ['U', 92, 146],
  ])('%s has %i protons and %i neutrons (most abundant isotope)', (s, p, n) => {
    const a = at(s);
    expect([a.protons, a.neutrons, a.electrons]).toEqual([p, n, p]);
  });

  it('does not derive neutrons by rounding the atomic mass', () => {
    // 63.546 rounds to 64, but copper-63 is the most abundant isotope.
    expect(at('Cu').massNumber).toBe(63);
  });

  it('reproduces known shell structures and configuration exceptions', () => {
    expect(at('Cu').shells).toEqual([2, 8, 18, 1]);
    expect(at('Cr').shells).toEqual([2, 8, 13, 1]);
    expect(at('Pd').shells).toEqual([2, 8, 18, 18]);
    expect(at('Og').shells).toEqual([2, 8, 18, 32, 32, 18, 8]);
    expect(at('Cu').config).toBe('[Ar] 3d10 4s1');
  });

  it('is self-consistent for all 118 elements', () => {
    for (const e of ELEMENTS) {
      const a = at(e.symbol);
      expect(a.shells.reduce((s, x) => s + x, 0), `${e.symbol} electrons`).toBe(e.atomicNumber);
      expect(a.neutrons, `${e.symbol} neutrons`).toBeGreaterThanOrEqual(0);
      a.shells.forEach((n, i) => expect(n, `${e.symbol} shell ${i + 1}`).toBeLessThanOrEqual(2 * (i + 1) ** 2)); // max 2n²
      expect(a.valenceElectrons, `${e.symbol} valence`).toBeLessThanOrEqual(a.shells[a.shells.length - 1]);
      if (a.naturalIsotopes.length) {
        const total = a.naturalIsotopes.reduce((s, [, p]) => s + p, 0);
        expect(total, `${e.symbol} abundance`).toBeGreaterThan(99);
        expect(total, `${e.symbol} abundance`).toBeLessThan(101);
      } else expect(a.radioactive, `${e.symbol} synthetic`).toBe(true);
    }
  });

  it('returns null for unknown symbols', () => expect(getAtomicStructure('Xx')).toBeNull());
});
