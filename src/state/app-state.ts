import type { AmountUnit, ExperimentRecord, Molecule, Preferences, Reactant, ReactionConditions, ReactionResult } from '../models';

export type View = 'simulation' | 'periodic' | 'reactions' | 'library' | 'history' | 'settings';

export interface AppState {
  selectedElements: Reactant[];
  currentResult: ReactionResult | null;
  activeView: View;
  searchQuery: string;
  inspected: string | null;
  reacting: boolean;
  conditions: ReactionConditions;
  /** true = engine assumes the recommended conditions for each reaction. */
  idealConditions: boolean;
  /** Product structure used by the formation animation while `reacting`. */
  animationTarget: Molecule | null;
  history: ExperimentRecord[];
  /** Formulas of saved compounds. */
  saved: string[];
  prefs: Preferences;
  /** Unit the quantity inputs are in. */
  amountUnit: AmountUnit;
}

let state: AppState = { selectedElements: [], currentResult: null, activeView: 'simulation', searchQuery: '', inspected: null, reacting: false,
  conditions: { temperature: 25, pressure: 1 }, idealConditions: true, animationTarget: null,
  history: [], saved: [], prefs: { animations: true, saveHistory: true }, amountUnit: 'atoms' };
const listeners = new Set<() => void>();

export const getState = (): AppState => state;
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}
export const toRecord = (rs: Reactant[]): Record<string, number> => Object.fromEntries(rs.map((r) => [r.element, r.quantity]));
