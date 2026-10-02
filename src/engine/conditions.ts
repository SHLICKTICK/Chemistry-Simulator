import type { ReactionConditions, ReactionRequirements } from '../models';

/**
 * Educational threshold model: a recorded reaction "proceeds" only if each minimum is met.
 * This is NOT kinetics — it ignores activation energy, rate laws and equilibrium (future work).
 */
export function unmetRequirements(req: ReactionRequirements, c: ReactionConditions): string[] {
  const out: string[] = [];
  if (req.minTemperature !== undefined && c.temperature < req.minTemperature)
    out.push(`Temperature is too low: about ${req.minTemperature} °C or higher is needed (you set ${c.temperature} °C).`);
  if (req.minPressure !== undefined && c.pressure < req.minPressure)
    out.push(`Pressure is too low: about ${req.minPressure} atm or higher is needed (you set ${c.pressure} atm).`);
  if (req.catalyst && c.catalyst !== req.catalyst) out.push(`A ${req.catalyst} catalyst is needed.`);
  return out;
}
