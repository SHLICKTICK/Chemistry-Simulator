/** Common polyatomic ions. Monatomic ions come from the element data (charge given per compound). */
export const POLYATOMIC_IONS: Record<string, { name: string; charge: number }> = {
  OH: { name: 'hydroxide', charge: -1 },
  NO3: { name: 'nitrate', charge: -1 },
  SO4: { name: 'sulfate', charge: -2 },
  CO3: { name: 'carbonate', charge: -2 },
  HCO3: { name: 'hydrogen carbonate', charge: -1 },
  PO4: { name: 'phosphate', charge: -3 },
  NH4: { name: 'ammonium', charge: 1 },
};
