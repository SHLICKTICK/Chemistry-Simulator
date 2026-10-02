import type { Element } from '../models';
import { atomColor } from '../utils/chemistry';
import { MAX_QUANTITY } from '../utils/validation';

export function renderQuantity(e: Element, q: number): string {
  return `<div class="qty-card" style="--accent:${atomColor(e.symbol)}">
    <div class="qty-head"><span class="badge">${e.symbol}</span>${e.name}</div>
    <div class="qty-row">
      <button class="step" data-action="qty" data-symbol="${e.symbol}" data-delta="-1" aria-label="Decrease ${e.name}" ${q <= 1 ? 'disabled' : ''}>−</button>
      <input type="number" min="1" max="${MAX_QUANTITY}" value="${q}" data-qty-input="${e.symbol}" aria-label="${e.name} quantity" />
      <button class="step" data-action="qty" data-symbol="${e.symbol}" data-delta="1" aria-label="Increase ${e.name}" ${q >= MAX_QUANTITY ? 'disabled' : ''}>+</button>
    </div></div>`;
}
