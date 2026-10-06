import { COMPOUND_PHASE, ELEMENT_PHASE } from '../data/phase-data';
import type { PhaseData, PhaseInfo } from '../models';

/**
 * State of matter at temperature `t` (°C) and 1 atm. Pressure is NOT modelled.
 * Order of checks: decomposition → sublimation → solid / liquid / gas by melting and boiling point.
 * Returns null when there is no usable data (e.g. superheavy elements).
 */
export function phaseAt(p: PhaseData, t: number): PhaseInfo | null {
  if (p.decomposesAt !== undefined && t >= p.decomposesAt) return { state: 'Decomposes', note: p.note };
  if (p.sublimesAt !== undefined) return { state: t < p.sublimesAt ? 'Solid' : 'Gas', note: p.note };
  const { mp, bp } = p;
  if (mp === null && bp === null) return null;
  if (mp !== null && bp !== null && mp >= bp) return { state: t < bp ? 'Solid' : 'Gas' }; // sublimes at 1 atm (e.g. CO2, As)
  if (mp !== null && t < mp) return { state: 'Solid' };
  if (bp !== null && t >= bp) return { state: 'Gas' };
  return { state: 'Liquid' };
}

export function elementStateAt(symbol: string, t: number): PhaseInfo | null {
  const e = ELEMENT_PHASE[symbol];
  return e ? phaseAt({ mp: e[0], bp: e[1] }, t) : null;
}

export function compoundStateAt(formula: string, t: number): PhaseInfo | null {
  const c = COMPOUND_PHASE[formula];
  return c ? phaseAt(c, t) : null;
}
