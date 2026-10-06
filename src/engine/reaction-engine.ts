/**
 * Reaction engine — deliberately separates three layers of knowledge:
 *   1. Recorded reaction   (reactions.ts)  → strongest claim: "this reaction is recorded"
 *   2. Known compound      (compounds.ts)  → weaker claim:    "this composition exists"
 *   3. Formula generation  (compound-builder.ts) → NEVER a success; only a hint
 * Nothing here is an AI guess; every output is deterministic.
 *
 * Quantities are numbers of atoms (equivalently, moles of atoms). Atoms can't be split, so the engine works out
 * how many COMPLETE product units they make (the limiting reagent) and reports whatever is left over.
 */
import { COMPOUNDS } from '../data/compounds';
import { ELEMENT_BY_SYMBOL } from '../data/elements';
import { REACTIONS } from '../data/reactions';
import type { AtomComposition, Compound, Reaction, ReactionConditions, ReactionResult } from '../models';
import { validateReactants } from '../utils/validation';
import { explainFormation, predictBinary } from './compound-builder';
import { unmetRequirements } from './conditions';
import { balance, formatEquation } from './equation-balancer';
import { parseFormula } from './formula-parser';
import { compoundStateAt, elementStateAt } from './phase';
import { buildMolecule } from './molecule-builder';
import { reactionEnthalpy } from './thermo';

const fail = (error: string, extra: Partial<ReactionResult> = {}): ReactionResult => ({ success: false, error, ...extra });

function compositionOf(c: Compound): AtomComposition[] {
  return c.atoms
    .map((a) => ({ symbol: a.symbol, name: ELEMENT_BY_SYMBOL[a.symbol].name, count: a.count, mass: Number((ELEMENT_BY_SYMBOL[a.symbol].atomicMass * a.count).toFixed(3)) }))
    .sort((a, b) => b.mass - a.mass);
}

/** States at the temperature in effect. Only reported as a separate line when it differs from the 25 °C standard state. */
function stateInfo(c: Compound, input: Record<string, number>, t: number, pressure: number): Partial<ReactionResult> {
  const out: Partial<ReactionResult> = { temperature: t };
  const reactantStates = Object.keys(input).flatMap((symbol) => {
    const st = elementStateAt(symbol, t);
    return st ? [{ symbol, name: ELEMENT_BY_SYMBOL[symbol].name, state: st.state }] : [];
  });
  if (reactantStates.length) out.reactantStates = reactantStates;
  const now = compoundStateAt(c.formula, t);
  if (now && Math.abs(t - 25) > 0.5) {
    const note = [now.note, pressure < 0.5 || pressure > 1.5 ? 'Melting and boiling points are for 1 atm; pressure is not modelled.' : undefined].filter(Boolean).join(' ');
    out.stateAtConditions = { temperature: t, state: now.state, ...(note ? { note } : {}) };
  }
  return out;
}

function fromCompound(c: Compound, basis: ReactionResult['basis'], extra: Partial<ReactionResult>): ReactionResult {
  return {
    success: true, formula: c.formula, name: c.name, molarMass: c.molarMass, state: c.state, type: c.type,
    description: c.description, atoms: compositionOf(c), basis, explanation: explainFormation(c), molecule: buildMolecule(c), ...extra,
  };
}

interface Candidate { compound: Compound; reaction?: Reaction; made: number; leftover: Record<string, number>; leftoverTotal: number; need: Record<string, number> }

/** Every known compound built from exactly the chosen elements, with how many units the atoms can make. */
const clean = (x: number): number => (Math.abs(x) < 1e-9 ? 0 : x); // float noise from g ↔ mol conversion

function candidatesFor(input: Record<string, number>, continuous: boolean): Candidate[] {
  const symbols = Object.keys(input);
  const out: Candidate[] = [];
  for (const compound of COMPOUNDS) {
    const need = parseFormula(compound.formula), keys = Object.keys(need);
    if (keys.length !== symbols.length || keys.some((k) => !(k in input))) continue;
    const made = Math.min(...keys.map((k) => (continuous ? input[k] / need[k] : Math.floor(input[k] / need[k]))));
    const leftover = Object.fromEntries(keys.map((k) => [k, clean(input[k] - made * need[k])]));
    out.push({ compound, need, made, leftover, leftoverTotal: Object.values(leftover).reduce((s, n) => s + n, 0),
      reaction: REACTIONS.find((r) => compound.formula in r.products) });
  }
  return out;
}

/** Add the heat for the user's actual amount (kJ per mole of product × moles made), mol/g modes only. */
function scaledEnthalpy(h: ReactionResult['enthalpy'], molesMade?: number): ReactionResult['enthalpy'] {
  return h && molesMade !== undefined ? { ...h, forAmount: Number((h.perMoleProduct * molesMade).toFixed(1)) } : h;
}

/**
 * Combine amounts of elements. By default `input` is a count of atoms, e.g. { H: 2, O: 1 } (whole molecules only).
 * With `continuous`, `input` is moles of atoms (see amounts.ts) and fractional amounts are allowed.
 * `conditions` omitted/null = each recorded reaction gets the conditions it needs.
 */
export function combine(input: Record<string, number>, conditions?: ReactionConditions | null, options: { continuous?: boolean } = {}): ReactionResult {
  const continuous = !!options.continuous;
  const invalid = validateReactants(input, continuous);
  if (invalid) return fail(invalid);
  const symbols = Object.keys(input);
  if (symbols.length < 2) return fail('A single element has nothing to combine with.', { suggestions: ['Add at least one more element.'] });

  const candidates = candidatesFor(input, continuous);
  // A recorded reaction (a known way to make it) beats a bare compound match; then prefer the product that wastes the fewest atoms.
  const best = candidates.filter((c) => c.made >= (continuous ? 1e-9 : 1))
    .sort((a, b) => Number(!!b.reaction) - Number(!!a.reaction) || a.leftoverTotal - b.leftoverTotal)[0];

  if (!best) {
    if (candidates.length)
      return fail('There are not enough atoms to form even one complete molecule.', {
        suggestions: candidates.map((c) => `One ${c.compound.name} (${c.compound.formula}) needs ${c.compound.atoms.map((a) => `${a.symbol}:${a.count}`).join(', ')}.`),
      });
    const predicted = symbols.length === 2 ? predictBinary(symbols[0], symbols[1]) : null;
    return fail('No known compound or reaction was found for this combination.', {
      suggestions: ['Try changing the elements or quantities.'], predictedFormula: predicted?.formula,
      description: predicted
        ? `Charge balancing suggests the formula ${predicted.formula}, but ChemSim has no record that it forms, so it is not reported as a result.`
        : 'These elements cannot be paired using simple oxidation-state rules, and no recorded compound matches.',
    });
  }

  const { compound, reaction, made, leftover, leftoverTotal, need } = best;
  const temperature = conditions ? conditions.temperature : (reaction?.conditions?.temperature ?? 25);
  const states = stateInfo(compound, input, temperature, conditions?.pressure ?? reaction?.conditions?.pressure ?? 1);
  const extra: Partial<ReactionResult> = {
    amount: made,
    leftovers: Object.entries(leftover).filter(([, n]) => n > 0).map(([symbol, count]) => ({
      symbol, name: ELEMENT_BY_SYMBOL[symbol].name, count, ...(continuous ? { grams: count * ELEMENT_BY_SYMBOL[symbol].atomicMass } : {}),
    })),
    ...(continuous ? { continuous: true, productGrams: made * compound.molarMass } : {}),
  };
  if (leftoverTotal > 0) {
    // The limiting reagent is the element with the smallest supply relative to what one unit needs.
    const lim = Object.keys(need).reduce((a, b) => (input[b] / need[b] < input[a] / need[a] ? b : a));
    extra.limiting = { symbol: lim, name: ELEMENT_BY_SYMBOL[lim].name };
  }

  if (reaction) {
    const re = Object.keys(reaction.reactants), pr = Object.keys(reaction.products), coefs = balance(re, pr);
    if (coefs) {
      const equation = formatEquation(re, pr, coefs, !!reaction.reversible);
      const unmet = conditions && reaction.requirements ? unmetRequirements(reaction.requirements, conditions) : [];
      if (unmet.length)
        return fail('This reaction is recorded, but the chosen conditions are not enough for it to proceed.', {
          recognisedEquation: equation, suggestions: unmet,
          description: 'This is a simplified threshold model. Real reactions also depend on activation energy, reaction rate and equilibrium.',
        });
      return fromCompound(compound, 'known-reaction', {
        ...extra, ...states, equation, conditions: reaction.conditions, enthalpy: scaledEnthalpy(reactionEnthalpy(re, pr, coefs), continuous ? made : undefined),
        observations: reaction.observations, hazard: reaction.hazard, reversible: reaction.reversible,
      });
    }
  }
  return fromCompound(compound, 'known-compound', {
    ...extra, ...states,
    description: `${compound.description}\n\nChemSim matched these atoms to a known compound but has no recorded reaction for making it directly from these elements.`,
  });
}
