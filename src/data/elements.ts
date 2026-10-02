import type { Category, Element } from '../models';

// [Z, symbol, name, mass, category, valence e-, oxidation states (most common first), period, group]
type Row = [number, string, string, number, Category, number, number[], number, number];
const ROWS: Row[] = [
  [1, 'H', 'Hydrogen', 1.008, 'nonmetal', 1, [1, -1], 1, 1],
  [2, 'He', 'Helium', 4.0026, 'noble', 2, [0], 1, 18],
  [3, 'Li', 'Lithium', 6.94, 'alkali', 1, [1], 2, 1],
  [6, 'C', 'Carbon', 12.011, 'nonmetal', 4, [4, 2, -4], 2, 14],
  [7, 'N', 'Nitrogen', 14.007, 'nonmetal', 5, [-3, 3, 5, 4], 2, 15],
  [8, 'O', 'Oxygen', 15.999, 'nonmetal', 6, [-2], 2, 16],
  [9, 'F', 'Fluorine', 18.998, 'halogen', 7, [-1], 2, 17],
  [11, 'Na', 'Sodium', 22.99, 'alkali', 1, [1], 3, 1],
  [12, 'Mg', 'Magnesium', 24.305, 'alkaline', 2, [2], 3, 2],
  [13, 'Al', 'Aluminium', 26.982, 'post-transition', 3, [3], 3, 13],
  [14, 'Si', 'Silicon', 28.085, 'metalloid', 4, [4, -4], 3, 14],
  [15, 'P', 'Phosphorus', 30.974, 'nonmetal', 5, [-3, 5, 3], 3, 15],
  [16, 'S', 'Sulfur', 32.06, 'nonmetal', 6, [-2, 4, 6], 3, 16],
  [17, 'Cl', 'Chlorine', 35.45, 'halogen', 7, [-1, 1, 3, 5, 7], 3, 17],
  [19, 'K', 'Potassium', 39.098, 'alkali', 1, [1], 4, 1],
  [20, 'Ca', 'Calcium', 40.078, 'alkaline', 2, [2], 4, 2],
  [26, 'Fe', 'Iron', 55.845, 'transition', 2, [3, 2], 4, 8],
  [29, 'Cu', 'Copper', 63.546, 'transition', 1, [2, 1], 4, 11],
  [30, 'Zn', 'Zinc', 65.38, 'transition', 2, [2], 4, 12],
  [47, 'Ag', 'Silver', 107.868, 'transition', 1, [1], 5, 11],
  [79, 'Au', 'Gold', 196.967, 'transition', 1, [3, 1], 6, 11],
];
const EXTRA: Row[] = [
  [4, 'Be', 'Beryllium', 9.0122, 'alkaline', 2, [2], 2, 2],
  [5, 'B', 'Boron', 10.81, 'metalloid', 3, [3], 2, 13],
  [10, 'Ne', 'Neon', 20.18, 'noble', 8, [0], 2, 18],
  [18, 'Ar', 'Argon', 39.95, 'noble', 8, [0], 3, 18],
  [22, 'Ti', 'Titanium', 47.867, 'transition', 2, [4, 3], 4, 4],
  [23, 'V', 'Vanadium', 50.942, 'transition', 2, [5, 4, 3, 2], 4, 5],
  [24, 'Cr', 'Chromium', 51.996, 'transition', 1, [3, 2, 6], 4, 6],
  [25, 'Mn', 'Manganese', 54.938, 'transition', 2, [2, 4, 7], 4, 7],
  [27, 'Co', 'Cobalt', 58.933, 'transition', 2, [2, 3], 4, 9],
  [28, 'Ni', 'Nickel', 58.693, 'transition', 2, [2], 4, 10],
  [31, 'Ga', 'Gallium', 69.723, 'post-transition', 3, [3], 4, 13],
  [32, 'Ge', 'Germanium', 72.63, 'metalloid', 4, [4, 2], 4, 14],
  [33, 'As', 'Arsenic', 74.922, 'metalloid', 5, [3, 5, -3], 4, 15],
  [34, 'Se', 'Selenium', 78.971, 'nonmetal', 6, [-2, 4, 6], 4, 16],
  [35, 'Br', 'Bromine', 79.904, 'halogen', 7, [-1, 1, 5], 4, 17],
  [36, 'Kr', 'Krypton', 83.798, 'noble', 8, [0], 4, 18],
  [37, 'Rb', 'Rubidium', 85.468, 'alkali', 1, [1], 5, 1],
  [38, 'Sr', 'Strontium', 87.62, 'alkaline', 2, [2], 5, 2],
  [50, 'Sn', 'Tin', 118.71, 'post-transition', 4, [4, 2], 5, 14],
  [51, 'Sb', 'Antimony', 121.76, 'metalloid', 5, [3, 5], 5, 15],
  [53, 'I', 'Iodine', 126.904, 'halogen', 7, [-1, 1, 5, 7], 5, 17],
  [54, 'Xe', 'Xenon', 131.29, 'noble', 8, [0], 5, 18],
  [55, 'Cs', 'Caesium', 132.905, 'alkali', 1, [1], 6, 1],
  [56, 'Ba', 'Barium', 137.327, 'alkaline', 2, [2], 6, 2],
  [78, 'Pt', 'Platinum', 195.084, 'transition', 1, [2, 4], 6, 10],
  [80, 'Hg', 'Mercury', 200.592, 'transition', 2, [2, 1], 6, 12],
  [82, 'Pb', 'Lead', 207.2, 'post-transition', 4, [2, 4], 6, 14],
];

export const ELEMENTS: Element[] = [...ROWS, ...EXTRA].sort((a, b) => a[0] - b[0]).map(([atomicNumber, symbol, name, atomicMass, category, valenceElectrons, commonOxidationStates, period, group]) =>
  ({ atomicNumber, symbol, name, atomicMass, category, valenceElectrons, commonOxidationStates, period, group }));

export const ELEMENT_BY_SYMBOL: Record<string, Element> = Object.fromEntries(ELEMENTS.map((e) => [e.symbol, e]));

/** Elements shown in the "Choose Elements" row by default. */
export const QUICK_ELEMENTS = ['H', 'O', 'C', 'N', 'Na', 'Cl'];
