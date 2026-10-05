import type { Hazard, Reaction } from '../models';

interface Lab { observations: string[]; hazard?: Hazard; reversible?: boolean }
const caution = (note: string): Hazard => ({ level: 'caution', note });
const danger = (note: string): Hazard => ({ level: 'danger', note });

/** Shorthand: recorded reaction with a minimum temperature (°C) at which it proceeds. */
const rx = (reactants: Record<string, number>, products: Record<string, number>, minT: number, note: string | undefined, lab: Lab): Reaction => ({
  reactants, products, requirements: { minTemperature: minT }, conditions: { temperature: Math.max(minT, 25), pressure: 1, note }, ...lab,
});

/** Known, recorded reactions. Observations and hazards are qualitative and deliberately simplified (educational model). */
export const REACTIONS: Reaction[] = [
  rx({ H2: 2, O2: 1 }, { H2O: 2 }, 500, 'Needs a spark or flame to start; releases a lot of heat.', {
    observations: ['A pale blue, almost invisible flame.', 'A loud pop or explosion if the gases are premixed.', 'Water vapour condenses on cooler surfaces.'],
    hazard: danger('Hydrogen–oxygen mixtures can explode.') }),
  rx({ C: 1, O2: 1 }, { CO2: 1 }, 400, 'Burning carbon in excess oxygen.', {
    observations: ['Carbon glows red-hot, then burns.', 'Colourless carbon dioxide gas forms.'] }),
  rx({ C: 2, O2: 1 }, { CO: 2 }, 700, 'Burning carbon with limited oxygen.', {
    observations: ['Carbon burns with a blue flame.', 'Colourless, odourless carbon monoxide forms.'], hazard: danger('Carbon monoxide is highly toxic.') }),
  { reactants: { N2: 1, H2: 3 }, products: { NH3: 2 }, requirements: { minTemperature: 400, minPressure: 100, catalyst: 'Fe' },
    conditions: { temperature: 450, pressure: 200, catalyst: 'Fe', note: 'Haber–Bosch process.' }, reversible: true,
    observations: ['No visible change: every substance is a colourless gas.', 'Ammonia is recognisable by its sharp smell.'],
    hazard: caution('Ammonia is corrosive and toxic; the process needs high pressure.') },
  rx({ Na: 2, Cl2: 1 }, { NaCl: 2 }, 25, 'Highly exothermic once started.', {
    observations: ['Sodium burns with a bright yellow-orange flame.', 'White smoke of sodium chloride forms.', 'A great deal of heat is released.'],
    hazard: danger('Violent reaction, and chlorine gas is toxic.') }),
  rx({ Ca: 1, Cl2: 1 }, { CaCl2: 1 }, 25, undefined, {
    observations: ['Calcium burns brightly.', 'A white solid forms.'], hazard: caution('Chlorine gas is toxic.') }),
  rx({ Ca: 2, O2: 1 }, { CaO: 2 }, 600, undefined, { observations: ['Calcium burns with a brick-red flame.', 'A white solid forms.'] }),
  rx({ H2: 1, Cl2: 1 }, { HCl: 2 }, 25, 'Triggered by light or heat.', {
    observations: ['Explodes on a spark or in strong light.', 'Colourless hydrogen chloride gas fumes in moist air.'],
    hazard: danger('Can explode; hydrogen chloride is corrosive.') }),
  rx({ N2: 1, O2: 2 }, { NO2: 2 }, 1500, 'Simplified: in practice this proceeds via NO in several steps.', {
    observations: ['Brown nitrogen dioxide gas appears.', 'It forms in steps, via colourless nitric oxide.'], hazard: caution('Nitrogen dioxide is toxic.') }),
  rx({ Mg: 2, O2: 1 }, { MgO: 2 }, 600, 'Burns with a brilliant white flame.', {
    observations: ['Burns with a dazzling white flame.', 'A white powder (magnesium oxide) is left.'], hazard: caution('The flame is dazzling and can damage eyes.') }),
  rx({ Al: 4, O2: 3 }, { Al2O3: 2 }, 650, undefined, { observations: ['Burns with a bright white light.', 'White aluminium oxide forms.'] }),
  rx({ Fe: 4, O2: 3 }, { Fe2O3: 2 }, 500, 'Rusting at room temperature is much slower and needs water.', {
    observations: ['Hot iron glows and throws off sparks.', 'A dark red-brown oxide forms.'] }),
  rx({ Zn: 2, O2: 1 }, { ZnO: 2 }, 500, undefined, {
    observations: ['Zinc burns with a bright blue-green flame.', 'White zinc oxide smoke forms (yellow while hot).'], hazard: caution('Zinc oxide fumes are harmful to breathe.') }),
  rx({ Cu: 2, O2: 1 }, { CuO: 2 }, 300, undefined, { observations: ['The shiny copper surface turns black.', 'Black copper(II) oxide forms.'] }),
  rx({ S: 1, O2: 1 }, { SO2: 1 }, 250, 'Sulfur burns with a blue flame.', {
    observations: ['Sulfur burns with a pale blue flame.', 'A sharp, choking smell: sulfur dioxide.'], hazard: caution('Sulfur dioxide is a toxic, choking gas.') }),
  rx({ H2: 1, S: 1 }, { H2S: 1 }, 300, undefined, {
    observations: ['A colourless gas that smells of rotten eggs forms.'], hazard: danger('Hydrogen sulfide is highly toxic.') }),
  rx({ H2: 1, F2: 1 }, { HF: 2 }, 25, 'Reacts explosively, even in the cold and dark.', {
    observations: ['Reacts explosively even in the dark and cold.', 'Colourless, fuming hydrogen fluoride gas forms.'],
    hazard: danger('Violently explosive; fluorine and hydrogen fluoride are extremely hazardous.') }),
  rx({ K: 2, Cl2: 1 }, { KCl: 2 }, 25, undefined, {
    observations: ['Potassium burns with a lilac flame.', 'White smoke of potassium chloride forms.'], hazard: danger('Violent reaction, and chlorine gas is toxic.') }),
  rx({ Li: 2, F2: 1 }, { LiF: 2 }, 25, undefined, {
    observations: ['Lithium burns very vigorously.', 'A white solid (lithium fluoride) forms.'], hazard: danger('Fluorine is extremely hazardous.') }),
  rx({ Mg: 1, Cl2: 1 }, { MgCl2: 1 }, 100, undefined, {
    observations: ['Burns with a brilliant white flame.', 'A white solid forms.'], hazard: caution('Chlorine gas is toxic.') }),
  rx({ Al: 2, Cl2: 3 }, { AlCl3: 2 }, 150, undefined, {
    observations: ['Heated aluminium burns with a bright flame.', 'A white solid forms that fumes in moist air.'], hazard: caution('Chlorine gas is toxic.') }),
  rx({ Fe: 2, Cl2: 3 }, { FeCl3: 2 }, 200, undefined, {
    observations: ['Hot iron burns in chlorine.', 'Dark brown fumes of iron(III) chloride appear.'], hazard: caution('Chlorine gas is toxic.') }),
];
