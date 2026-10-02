import type { Element } from '../models';
import { atomColor } from '../utils/chemistry';

/** Large card used in "Choose Elements". Selected state is shown with a check mark, not colour alone. */
export function renderElementCard(e: Element, selected: boolean): string {
  return `<button class="el-card ${selected ? 'is-selected' : ''}" style="--accent:${atomColor(e.symbol)}" data-action="toggle" data-symbol="${e.symbol}" aria-pressed="${selected}">
    ${selected ? '<span class="check" aria-hidden="true">✓</span>' : ''}
    <span class="tile"><small>${e.atomicNumber}</small>${e.symbol}</span>
    <span class="nm">${e.name}</span><span class="ms">${e.atomicMass}</span>
  </button>`;
}
