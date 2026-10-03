import { ELEMENTS, ELEMENT_BY_SYMBOL } from '../data/elements';
import type { AppState } from '../state/app-state';
import { atomColor } from '../utils/chemistry';
import { renderAtomicStructure } from './AtomicStructure';

const LABELS: [string, string][] = [['alkali', 'Alkali metal'], ['alkaline', 'Alkaline earth'], ['transition', 'Transition metal'], ['post-transition', 'Post-transition metal'],
  ['lanthanide', 'Lanthanide'], ['actinide', 'Actinide'], ['metalloid', 'Metalloid'], ['nonmetal', 'Nonmetal'], ['halogen', 'Halogen'], ['noble', 'Noble gas']];
const LEGEND = `<ul class="legend" aria-label="Element categories">${LABELS.map(([c, l]) => `<li class="cat-${c}"><i></i>${l}</li>`).join('')}</ul>`;

export function renderPeriodic(s: AppState): string {
  const q = s.searchQuery.trim().toLowerCase();
  const match = (e: (typeof ELEMENTS)[number]) => !q || e.name.toLowerCase().includes(q) || e.symbol.toLowerCase() === q || String(e.atomicNumber) === q;
  const picked = new Set(s.selectedElements.map((r) => r.element));
  const cells = ELEMENTS.map((e) => `
    <button class="pt-cell cat-${e.category} ${match(e) ? '' : 'dim'} ${picked.has(e.symbol) ? 'is-selected' : ''}" style="grid-column:${e.col};grid-row:${e.row}"
      data-action="inspect" data-symbol="${e.symbol}" aria-label="${e.name}, atomic number ${e.atomicNumber}${picked.has(e.symbol) ? ', selected' : ''}">
      <small>${e.atomicNumber}</small><b>${e.symbol}</b><span>${e.name}</span><small>${e.atomicMass}</small>
    </button>`).join('');
  const e = s.inspected ? ELEMENT_BY_SYMBOL[s.inspected] : null;
  const detail = e ? `<section class="detail" style="--accent:${atomColor(e.symbol)}">
      <div class="tile big"><small>${e.atomicNumber}</small>${e.symbol}</div>
      <div><h2>${e.name}</h2>
        <dl><dt>Atomic mass</dt><dd>${e.atomicMass} u</dd><dt>Category</dt><dd>${e.category}</dd>
        <dt>Valence electrons</dt><dd>${e.valenceElectrons}</dd><dt>Common oxidation states</dt><dd>${e.commonOxidationStates.length ? e.commonOxidationStates.map((n) => (n > 0 ? `+${n}` : n)).join(', ') : 'not well established'}</dd></dl>
        <button class="combine small" data-action="add" data-symbol="${e.symbol}">${picked.has(e.symbol) ? 'Remove from experiment' : 'Add to experiment'}</button></div></section>${renderAtomicStructure(e.symbol)}`
    : '<p class="empty">Select an element to see its details.</p>';
  return `<h1>Periodic Table</h1><p class="sub">All ${ELEMENTS.length} elements. Search above to filter; lanthanides and actinides sit below the main table.</p>
    <div class="pt-scroll"><div class="pt-grid">${cells}</div></div>${LEGEND}${detail}`;
}
