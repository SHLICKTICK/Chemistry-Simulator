import type { Reaction } from '../models';

/** Shorthand: recorded reaction with a minimum temperature (°C) at which it proceeds. */
const rx = (reactants: Record<string, number>, products: Record<string, number>, minT: number, note?: string): Reaction => ({
  reactants, products, requirements: { minTemperature: minT }, conditions: { temperature: Math.max(minT, 25), pressure: 1, note },
});

/** Known, recorded reactions (educational model, not a rigorous kinetics database). */
export const REACTIONS: Reaction[] = [
  rx({ H2: 2, O2: 1 }, { H2O: 2 }, 500, 'Needs a spark or flame to start; releases a lot of heat.'),
  rx({ C: 1, O2: 1 }, { CO2: 1 }, 400, 'Burning carbon in excess oxygen.'),
  rx({ C: 2, O2: 1 }, { CO: 2 }, 700, 'Burning carbon with limited oxygen.'),
  { reactants: { N2: 1, H2: 3 }, products: { NH3: 2 }, requirements: { minTemperature: 400, minPressure: 100, catalyst: 'Fe' },
    conditions: { temperature: 450, pressure: 200, catalyst: 'Fe', note: 'Haber–Bosch process.' } },
  rx({ Na: 2, Cl2: 1 }, { NaCl: 2 }, 25, 'Highly exothermic once started.'),
  rx({ Ca: 1, Cl2: 1 }, { CaCl2: 1 }, 25),
  rx({ Ca: 2, O2: 1 }, { CaO: 2 }, 600),
  rx({ H2: 1, Cl2: 1 }, { HCl: 2 }, 25, 'Triggered by light or heat.'),
  rx({ N2: 1, O2: 2 }, { NO2: 2 }, 1500, 'Simplified: in practice this proceeds via NO in several steps.'),
  rx({ Mg: 2, O2: 1 }, { MgO: 2 }, 600, 'Burns with a brilliant white flame.'),
  rx({ Al: 4, O2: 3 }, { Al2O3: 2 }, 650),
  rx({ Fe: 4, O2: 3 }, { Fe2O3: 2 }, 500, 'Rusting at room temperature is much slower and needs water.'),
  rx({ Zn: 2, O2: 1 }, { ZnO: 2 }, 500),
  rx({ Cu: 2, O2: 1 }, { CuO: 2 }, 300),
  rx({ S: 1, O2: 1 }, { SO2: 1 }, 250, 'Sulfur burns with a blue flame.'),
  rx({ H2: 1, S: 1 }, { H2S: 1 }, 300),
  rx({ H2: 1, F2: 1 }, { HF: 2 }, 25, 'Reacts explosively, even in the cold and dark.'),
  rx({ K: 2, Cl2: 1 }, { KCl: 2 }, 25),
  rx({ Li: 2, F2: 1 }, { LiF: 2 }, 25),
  rx({ Mg: 1, Cl2: 1 }, { MgCl2: 1 }, 100),
  rx({ Al: 2, Cl2: 3 }, { AlCl3: 2 }, 150),
  rx({ Fe: 2, Cl2: 3 }, { FeCl3: 2 }, 200),
];
