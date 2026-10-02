export interface Preset { label: string; sub: string; reactants: Record<string, number> }
export const PRESETS: Preset[] = [
  { label: 'H + O', sub: 'Water (H2O)', reactants: { H: 2, O: 1 } },
  { label: 'C + O2', sub: 'Carbon Dioxide (CO2)', reactants: { C: 1, O: 2 } },
  { label: 'N + H', sub: 'Ammonia (NH3)', reactants: { N: 1, H: 3 } },
  { label: 'Na + Cl', sub: 'Sodium Chloride (NaCl)', reactants: { Na: 1, Cl: 1 } },
];
