import { ATOMIC_STRUCTURE } from '../data/atomic-structure';
import { ELEMENT_BY_SYMBOL } from '../data/elements';

export interface AtomicStructure {
  symbol: string; protons: number; neutrons: number; electrons: number;
  massNumber: number; shells: number[]; config: string; valenceElectrons: number;
  /** The isotope used for the neutron count is unstable. */
  radioactive: boolean;
  /** [mass number, abundance %] for naturally occurring isotopes (empty for purely synthetic/trace elements). */
  naturalIsotopes: [number, number][];
}

/**
 * Subatomic make-up of a NEUTRAL atom of the element's most abundant isotope (or, for elements with no natural
 * isotopes, a representative isotope). Protons = electrons = atomic number; neutrons = mass number − protons.
 * Rounding the atomic mass would give wrong answers (e.g. Cu 63.546 → 64, but copper-63 is the common isotope).
 */
export function getAtomicStructure(symbol: string): AtomicStructure | null {
  const el = ELEMENT_BY_SYMBOL[symbol], data = ATOMIC_STRUCTURE[symbol];
  if (!el || !data) return null;
  return {
    symbol, protons: el.atomicNumber, neutrons: data.massNumber - el.atomicNumber, electrons: el.atomicNumber,
    massNumber: data.massNumber, shells: data.shells, config: data.config, valenceElectrons: el.valenceElectrons,
    radioactive: data.radioactive, naturalIsotopes: data.natural,
  };
}
