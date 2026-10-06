export type Category = 'nonmetal' | 'noble' | 'alkali' | 'alkaline' | 'metalloid' | 'halogen' | 'post-transition' | 'transition' | 'lanthanide' | 'actinide';

export interface Element {
  atomicNumber: number; symbol: string; name: string; atomicMass: number;
  category: Category; valenceElectrons: number;
  /** Ordered: the first entry is the most common state. */
  commonOxidationStates: number[];
  period: number; group: number | null; // group is null for the f-block (Ce–Lu, Th–Lr)
  /** Position in the periodic-table grid (f-block rows sit below the main table). */
  row: number; col: number;
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
export interface Hazard { level: 'caution' | 'danger'; note: string }
export interface Reaction {
  reactants: Record<string, number>; products: Record<string, number>;
  conditions?: ReactionConditions; requirements?: ReactionRequirements;
  /** What you would see, hear or smell (qualitative, simplified). */
  observations?: string[]; hazard?: Hazard;
  /** Reaction only partly converts (equilibrium), shown with ⇌. */
  reversible?: boolean;
}
export interface ReactionEnthalpy {
  /** kJ for the equation as written (negative = heat released). */
  total: number; perMoleProduct: number;
  /** kJ for the amounts you entered (mol/g modes only; negative = heat released). */
  forAmount?: number;
  kind: 'exothermic' | 'endothermic' | 'thermoneutral';
}
export type AmountUnit = 'atoms' | 'mol' | 'g';
/** count = atoms (atoms mode) or moles of atoms (mol/g modes); grams only in mol/g modes. */
export interface Leftover { symbol: string; name: string; count: number; grams?: number }

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
  /** How many product molecules/formula units your atoms make, and what is left over. */
  amount?: number; continuous?: boolean; productGrams?: number; leftovers?: Leftover[]; limiting?: { symbol: string; name: string };
  /** State at the temperature in effect (only when it differs from 25 °C), and the starting elements' states at that temperature. */
  stateAtConditions?: { temperature: number; state: string; note?: string };
  reactantStates?: { symbol: string; name: string; state: string }[]; temperature?: number;
  enthalpy?: ReactionEnthalpy; observations?: string[]; hazard?: Hazard; reversible?: boolean;
}

/** One run of the engine, stored with its inputs so it can be re-run deterministically. */
export interface ExperimentRecord {
  id?: number; timestamp: number;
  /** Amounts exactly as entered, in `unit` (older records have no unit = atoms). */
  reactants: Record<string, number>; unit?: AmountUnit;
  /** null = recommended conditions were used. */
  conditions: ReactionConditions | null;
  success: boolean; formula?: string; name?: string; equation?: string;
}
export interface SavedCompound { formula: string; name: string; savedAt: number }
export interface Preferences { animations: boolean; saveHistory: boolean }

/** Melting/boiling points in °C at 1 atm, plus flags for compounds that decompose or sublime rather than melt. */
export interface PhaseData { mp: number | null; bp: number | null; decomposesAt?: number; sublimesAt?: number; note?: string }
export type PhaseState = 'Solid' | 'Liquid' | 'Gas' | 'Decomposes';
export interface PhaseInfo { state: PhaseState; note?: string }
