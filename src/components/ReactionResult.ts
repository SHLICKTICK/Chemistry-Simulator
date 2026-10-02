import { ELEMENT_BY_SYMBOL } from '../data/elements';
import type { AppState } from '../state/app-state';
import { atomColor } from '../utils/chemistry';
import { escapeHtml, formatFormula, formatMass } from '../utils/formatting';
import { renderFormation } from './FormationAnimation';
import { renderMoleculeSlot } from './MoleculeViewer';

export function renderResult(s: AppState): string {
  const head = '<h2 class="r-title">Reaction Result</h2>';
  if (s.reacting && s.animationTarget)
    return `${head}<p class="status">Atoms gather and bonds form…</p><div class="stage">${renderFormation(s.animationTarget)}</div>`;
  if (s.reacting) {
    const atoms = s.selectedElements.flatMap((r) => Array.from({ length: Math.min(r.quantity, 6) }, () => r.element));
    return `${head}<p class="status">Atoms are combining…</p><div class="stage" aria-hidden="true">${atoms.map((el, i) =>
      `<span class="blob" style="--c:${atomColor(el)};--i:${i};--n:${atoms.length}">${el}</span>`).join('')}</div>`;
  }
  const r = s.currentResult;
  if (!r) return `${head}<p class="empty">Choose elements, set quantities, and press Combine. The result appears here.</p>`;
  if (!r.success) {
    return `${head}<p class="status bad"><span aria-hidden="true">✕</span> No compound formed</p>
      <p class="err">${escapeHtml(r.error ?? '')}</p>
      ${r.recognisedEquation ? `<p class="equation">${formatFormula(r.recognisedEquation)}</p>` : ''}
      ${r.description ? `<p class="muted">${formatFormula(escapeHtml(r.description))}</p>` : ''}
      ${r.suggestions?.length ? `<ul class="hints">${r.suggestions.map((t) => `<li>${formatFormula(escapeHtml(t))}</li>`).join('')}</ul>` : ''}`;
  }
  const basis = r.basis === 'known-reaction' ? 'Recorded reaction' : 'Known compound (no recorded synthesis)';
  return `${head}<p class="status ok"><span aria-hidden="true">✓</span> Compound Formed!</p>
  <div class="formula-row">
    <div><div class="formula">${formatFormula(r.formula!)}</div><div class="cname">${r.name}</div></div>
    <dl class="facts"><dt>Molar Mass</dt><dd>${formatMass(r.molarMass!)}</dd><dt>Type</dt><dd>${r.type}</dd><dt>State (at 25°C)</dt><dd>${r.state}</dd></dl>
  </div>
  ${r.equation ? `<p class="equation" aria-label="Balanced equation">${formatFormula(r.equation)}</p>` : ''}
  <p class="basis">${basis}</p>
  <button class="ghost star" data-action="save" data-formula="${r.formula}" aria-pressed="${s.saved.includes(r.formula!)}">${s.saved.includes(r.formula!) ? '★ Saved' : '☆ Save compound'}</button>
  <div class="mol-wrap">${renderMoleculeSlot(r.molecule)}</div>
  <section class="panel"><h3>Molecule Breakdown</h3>
    ${r.atoms!.map((a) => `<div class="b-row"><span class="dot" style="background:${atomColor(a.symbol)}"></span><span>${ELEMENT_BY_SYMBOL[a.symbol].name} (${a.symbol})</span><span>${a.count}</span><span>${formatMass(a.mass)}</span></div>`).join('')}
    <div class="b-total"><span>Total Molar Mass</span><b>${formatMass(r.molarMass!)}</b></div></section>
  <section class="panel"><h3>About ${r.name} (${formatFormula(r.formula!)})</h3>
    ${r.description!.split('\n\n').map((p) => `<p>${formatFormula(escapeHtml(p))}</p>`).join('')}</section>
  <section class="panel"><h3>Why does this form?</h3>${r.explanation!.map((p) => `<p>${formatFormula(escapeHtml(p))}</p>`).join('')}
    ${r.conditions ? `<p class="muted">Typical conditions: ${r.conditions.temperature} °C, ${r.conditions.pressure} atm${r.conditions.catalyst ? `, ${r.conditions.catalyst} catalyst` : ''}. ${escapeHtml(r.conditions.note ?? '')}</p>` : ''}</section>`;
}
