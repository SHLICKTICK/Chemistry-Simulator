import { PRESETS } from '../data/presets';
import { formatFormula } from '../utils/formatting';

export const renderPresets = (): string => `<div class="presets">${PRESETS.map((p, i) =>
  `<button class="preset" data-action="preset" data-index="${i}"><b>${formatFormula(p.label)}</b><small>${formatFormula(p.sub)}</small></button>`).join('')}</div>`;
