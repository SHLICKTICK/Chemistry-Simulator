import { ELEMENT_BY_SYMBOL, QUICK_ELEMENTS } from '../data/elements';
import type { AppState } from '../state/app-state';
import { renderElementCard } from './ElementCard';
import { renderQuantity } from './QuantityControl';
import { renderPresets } from './QuickPresets';

function renderConditions(s: AppState): string {
  const c = s.conditions;
  const cat = ['', 'Fe', 'Pt'].map((v) => `<option value="${v}" ${c.catalyst === v || (!c.catalyst && !v) ? 'selected' : ''}>${v || 'None'}</option>`).join('');
  return `<h2>3. Conditions <small>(optional)</small></h2><section class="cond">
    <label class="check-row"><input type="checkbox" data-cond-ideal ${s.idealConditions ? 'checked' : ''} /> Use recommended conditions</label>
    ${s.idealConditions ? '<p class="muted">The engine assumes whatever conditions each recorded reaction needs. Untick to set your own.</p>'
    : `<div class="cond-grid">
      <label>Temperature (°C)<input type="number" min="-50" max="2000" step="10" value="${c.temperature}" data-cond="temperature" /></label>
      <label>Pressure (atm)<input type="number" min="0.1" max="300" step="1" value="${c.pressure}" data-cond="pressure" /></label>
      <label>Catalyst<select data-cond-catalyst>${cat}</select></label></div>
      <p class="muted">Simplified threshold model, not a kinetics simulation.</p>`}</section>`;
}

export function renderWorkspace(s: AppState): string {
  const picked = s.selectedElements.map((r) => r.element);
  const shown = [...QUICK_ELEMENTS, ...picked.filter((p) => !QUICK_ELEMENTS.includes(p))];
  return `
  <h1>Build Your Reaction</h1>
  <p class="sub">Select elements and combine them to form compounds.</p>
  <h2>1. Choose Elements</h2>
  <div class="el-row">${shown.map((sym) => renderElementCard(ELEMENT_BY_SYMBOL[sym], picked.includes(sym))).join('')}
    <button class="el-more" data-action="nav" data-view="periodic">All elements</button></div>
  <div class="qty-title"><h2>2. Set Quantity</h2>
    <div class="seg" role="group" aria-label="Amount unit">${(['atoms', 'mol', 'g'] as const).map((u) =>
      `<button type="button" class="seg-btn" data-action="unit" data-unit="${u}" aria-pressed="${s.amountUnit === u}">${{ atoms: 'Atoms', mol: 'Moles', g: 'Grams' }[u]}</button>`).join('')}</div></div>
  ${s.selectedElements.length
    ? `<div class="qty-grid">${s.selectedElements.map((r) => renderQuantity(ELEMENT_BY_SYMBOL[r.element], r.quantity, s.amountUnit)).join('')}</div>`
    : '<p class="empty">Pick an element above, or start from a preset below.</p>'}
  ${renderConditions(s)}
  <div class="actions">
    <button class="combine" data-action="combine" ${!s.selectedElements.length || s.reacting ? 'disabled' : ''}>${s.reacting ? 'Combining…' : 'Combine'}</button>
    <button class="ghost" data-action="reset" ${!s.selectedElements.length && !s.currentResult ? 'disabled' : ''}>Reset</button>
  </div>
  <h2>Quick Presets</h2>${renderPresets()}`;
}
