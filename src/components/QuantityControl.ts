import { toAtomMoles } from '../engine/amounts';
import type { AmountUnit, Element } from '../models';
import { atomColor, elementalForm } from '../utils/chemistry';
import { formatAmount, formatFormula } from '../utils/formatting';
import { UNIT_LIMITS } from '../utils/validation';

/** Unit label and a short note that keeps moles/grams tied back to atoms. */
function describe(e: Element, q: number, unit: AmountUnit): { label: string; note: string } {
  const atomMoles = formatAmount(toAtomMoles(e.symbol, q, unit));
  if (unit === 'mol') {
    const form = elementalForm(e.symbol);
    return { label: `mol ${formatFormula(form)}`, note: form === e.symbol ? '' : `= ${atomMoles} mol of ${e.symbol} atoms` };
  }
  if (unit === 'g') return { label: 'grams', note: `≈ ${atomMoles} mol of ${e.symbol} atoms` };
  return { label: 'atoms', note: '' };
}

export function renderQuantity(e: Element, q: number, unit: AmountUnit): string {
  const L = UNIT_LIMITS[unit], d = describe(e, q, unit);
  return `<div class="qty-card" style="--accent:${atomColor(e.symbol)}">
    <div class="qty-head"><span class="badge">${e.symbol}</span>${e.name}<span class="qty-unit">${d.label}</span></div>
    <div class="qty-row">
      <button class="step" data-action="qty" data-symbol="${e.symbol}" data-delta="-1" aria-label="Decrease ${e.name}" ${q <= L.min ? 'disabled' : ''}>−</button>
      <input type="number" min="${L.min}" max="${L.max}" step="${unit === 'atoms' ? 1 : 'any'}" value="${q}" data-qty-input="${e.symbol}" aria-label="${e.name} amount in ${d.label.replace(/<[^>]+>/g, '')}" />
      <button class="step" data-action="qty" data-symbol="${e.symbol}" data-delta="1" aria-label="Increase ${e.name}" ${q >= L.max ? 'disabled' : ''}>+</button>
    </div>
    ${d.note ? `<p class="qty-note">${d.note}</p>` : ''}</div>`;
}
