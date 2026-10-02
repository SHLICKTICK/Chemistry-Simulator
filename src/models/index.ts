export type Category = 'nonmetal' | 'noble' | 'alkali' | 'alkaline' | 'metalloid' | 'halogen' | 'post-transition' | 'transition';

export interface Element {
  atomicNumber: number; symbol: string; name: string; atomicMass: number;
  category: Category; valenceElectrons: number;
  /** Ordered: the first entry is the most common state. */
  commonOxidationStates: number[];
  period: number; group: number;
}

export interface Reactant { element: string; quantity: number }
export interface AtomCount { symbol: string; count: number }
export interface AtomComposition { symbol: string; name: string; count: number; mass: number }

export type Shape = 'linear' | 'bent' | 'pyramidal' | 'tetrahedral';
export interface Geometry { center: string; shape: Shape; bondOrder?: number; angle?: number }

export interface Compound {
  formula: string; name: string; molarMass: number; state: string; type: string;
  description: string; atoms: AtomCount[]; geometry?: Geometry;
  /** Ionic compounds: cation then anion, e.g. ['Ca:2', 'OH'] (charge optional for polyatomic ions). */
  ions?: [string, string];
}

export interface ReactionConditions {
  temperature: number; // °C
  pressure: number; // atm
  concentration?: number;
  catalyst?: string;
  note?: string;
}
/** Minimum conditions for a recorded reaction to proceed (educational threshold model). */
export interface ReactionRequirements { minTemperature?: number; minPressure?: number; catalyst?: string }
export interface Reaction {
  reactants: Record<string, number>; products: Record<string, number>;
  conditions?: ReactionConditions; requirements?: ReactionRequirements;
}

export interface Atom { element: string; position: { x: number; y: number; z: number } }
export interface Bond { from: number; to: number; order: number }
export interface Molecule { formula: string; atoms: Atom[]; bonds: Bond[] }

/** How the engine arrived at a result — never claim more than the data supports. */
export type Basis = 'known-reaction' | 'known-compound';

export interface ReactionResult {
  success: boolean;
  formula?: string; name?: string; molarMass?: number; state?: string; type?: string;
  description?: string; atoms?: AtomComposition[];
  equation?: string; basis?: Basis; explanation?: string[];
  conditions?: ReactionConditions; molecule?: Molecule | null;
  error?: string; suggestions?: string[]; predictedFormula?: string;
  /** Set when a reaction was recognised but the chosen conditions were insufficient. */
  recognisedEquation?: string;
}

/** One run of the engine, stored with its inputs so it can be re-run deterministically. */
export interface ExperimentRecord {
  id?: number; timestamp: number;
  reactants: Record<string, number>;
  /** null = recommended conditions were used. */
  conditions: ReactionConditions | null;
  success: boolean; formula?: string; name?: string; equation?: string;
}
export interface SavedCompound { formula: string; name: string; savedAt: number }
export interface Preferences { animations: boolean; saveHistory: boolean }
