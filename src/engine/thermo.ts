import { FORMATION_ENTHALPY } from '../data/thermo';
import type { ReactionEnthalpy } from '../models';
import { parseFormula } from './formula-parser';

/** Elements in their standard states (H2, O2, Na, C graphite, S ...) have ΔHf = 0 by definition. */
const hf = (formula: string): number | undefined => (Object.keys(parseFormula(formula)).length === 1 ? 0 : FORMATION_ENTHALPY[formula]);

/**
 * Standard reaction enthalpy at 25 °C:  ΔH = Σ ν·ΔHf(products) − Σ ν·ΔHf(reactants).
 * `coefs` are the balanced coefficients ordered [...reactants, ...products]. Returns undefined if any value is missing.
 */
export function reactionEnthalpy(reactants: string[], products: string[], coefs: number[]): ReactionEnthalpy | undefined {
  const species = [...reactants, ...products];
  let total = 0;
  for (let i = 0; i < species.length; i++) {
    const h = hf(species[i]);
    if (h === undefined) return undefined;
    total += (i < reactants.length ? -1 : 1) * coefs[i] * h;
  }
  total = Number(total.toFixed(1));
  return { total, perMoleProduct: Number((total / coefs[reactants.length]).toFixed(1)), kind: Math.abs(total) < 1 ? 'thermoneutral' : total < 0 ? 'exothermic' : 'endothermic' };
}
