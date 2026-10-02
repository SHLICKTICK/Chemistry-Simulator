/**
 * Reaction engine — deliberately separates three layers of knowledge:
 *   1. Known reaction recognition  (reactions.ts)  → strongest claim: "this reaction is recorded"
 *   2. Known compound lookup       (compounds.ts)  → weaker claim:    "this composition exists"
 *   3. Formula generation          (compound-builder.ts) → NEVER a success; only a hint
 * Nothing here is an AI guess; every output is deterministic.
 */
import { COMPOUNDS, COMPOUND_BY_FORMULA } from '../data/compounds';
import { ELEMENT_BY_SYMBOL } from '../data/elements';
import { REACTIONS } from '../data/reactions';
import type { AtomComposition, Compound, Reaction, ReactionConditions, ReactionResult } from '../models';
import { sameRatio } from '../utils/chemistry';
import { validateReactants } from '../utils/validation';
import { unmetRequirements } from './conditions';
import { explainFormation, predictBinary } from './compound-builder';
import { balance, formatEquation } from './equation-balancer';
import { parseFormula } from './formula-parser';
import { buildMolecule } from './molecule-builder';

const fail = (error: string, extra: Partial<ReactionResult> = {}): ReactionResult => ({ success: false, error, ...extra });

/** Total atoms on the reactant side of a recorded reaction. */
function reactantAtoms(r: Reaction): Record<string, number> {
  const t: Record<string, number> = {};
  for (const [f, k] of Object.entries(r.reactants)) for (const [e, n] of Object.entries(parseFormula(f))) t[e] = (t[e] ?? 0) + n * k;
  return t;
}

function compositionOf(c: Compound): AtomComposition[] {
  return c.atoms
    .map((a) => ({ symbol: a.symbol, name: ELEMENT_BY_SYMBOL[a.symbol].name, count: a.count, mass: Number((ELEMENT_BY_SYMBOL[a.symbol].atomicMass * a.count).toFixed(3)) }))
    .sort((a, b) => b.mass - a.mass);
}

function fromCompound(c: Compound, basis: ReactionResult['basis'], extra: Partial<ReactionResult>): ReactionResult {
  return {
    success: true, formula: c.formula, name: c.name, molarMass: c.molarMass, state: c.state, type: c.type,
    description: c.description, atoms: compositionOf(c), basis, explanation: explainFormation(c), molecule: buildMolecule(c), ...extra,
  };
}

/**
 * Combine atoms (e.g. { H: 2, O: 1 }) and report what the database supports.
 * `conditions` omitted/null = recommended conditions (each recorded reaction assumed to have what it needs).
 */
export function combine(input: Record<string, number>, conditions?: ReactionConditions | null): ReactionResult {
  const invalid = validateReactants(input);
  if (invalid) return fail(invalid);
  const symbols = Object.keys(input);
  if (symbols.length < 2)
    return fail('A single element has nothing to combine with.', { suggestions: ['Add at least one more element.'] });

  // 1. Known reaction
  const reaction = REACTIONS.find((r) => sameRatio(reactantAtoms(r), input));
  if (reaction) {
    const reactants = Object.keys(reaction.reactants), products = Object.keys(reaction.products);
    const coefs = balance(reactants, products);
    const compound = COMPOUND_BY_FORMULA[products[0]];
    if (coefs && compound) {
      const equation = formatEquation(reactants, products, coefs);
      const unmet = conditions && reaction.requirements ? unmetRequirements(reaction.requirements, conditions) : [];
      if (unmet.length)
        return fail('This reaction is recorded, but the chosen conditions are not enough for it to proceed.', {
          recognisedEquation: equation, suggestions: unmet,
          description: 'This is a simplified threshold model. Real reactions also depend on activation energy, reaction rate and equilibrium.',
        });
      return fromCompound(compound, 'known-reaction', { equation, conditions: reaction.conditions });
    }
  }

  // 2. Known compound with this exact composition ratio (no synthesis route recorded)
  const compound = COMPOUNDS.find((c) => sameRatio(parseFormula(c.formula), input));
  if (compound)
    return fromCompound(compound, 'known-compound', {
      description: `${compound.description}\n\nChemSim matched this atom ratio to a known compound but has no recorded reaction for making it directly from these elements.`,
    });

  // 3. No support — offer hints, but do not claim a reaction occurs.
  const set = new Set(symbols);
  const related = COMPOUNDS.filter((c) => c.atoms.length === set.size && c.atoms.every((a) => set.has(a.symbol)));
  const suggestions = related.length
    ? related.map((c) => `${c.name} (${c.formula}) needs ${c.atoms.map((a) => `${a.symbol}:${a.count}`).join(' to ')}.`)
    : ['Try changing the elements or quantities.'];
  const predicted = symbols.length === 2 ? predictBinary(symbols[0], symbols[1]) : null;
  return fail('No known compound or reaction was found for this combination.', {
    suggestions, predictedFormula: predicted?.formula,
    description: predicted
      ? `Charge balancing suggests the formula ${predicted.formula}, but ChemSim has no record that it forms, so it is not reported as a result.`
      : 'These elements cannot be paired using simple oxidation-state rules, and no recorded compound matches.',
  });
}
