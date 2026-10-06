import { ELEMENT_BY_SYMBOL } from '../data/elements';
import type { ReactionResult } from '../models';
import type { AppState } from '../state/app-state';
import { atomColor } from '../utils/chemistry';
import { escapeHtml, formatAmount, formatFormula, formatMass } from '../utils/formatting';
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
    <dl class="facts"><dt>Molar Mass</dt><dd>${formatMass(r.molarMass!)}</dd><dt>Type</dt><dd>${r.type}</dd><dt>State (at 25°C)</dt><dd>${r.state}</dd>${r.stateAtConditions ? `<dt>At ${r.stateAtConditions.temperature} °C</dt><dd>${r.stateAtConditions.state}</dd>` : ''}</dl>
  </div>
  ${r.stateAtConditions?.note ? `<p class="muted tiny">${formatFormula(escapeHtml(r.stateAtConditions.note))}</p>` : ''}
  ${r.equation ? `<p class="equation" aria-label="Balanced equation">${formatFormula(r.equation)}</p>` : ''}
  <p class="basis">${basis}</p>
  ${renderAmounts(r)}${r.hazard ? `<p class="hazard ${r.hazard.level}" role="note"><b>⚠ ${r.hazard.level === 'danger' ? 'Danger' : 'Caution'}:</b> ${escapeHtml(r.hazard.note)}</p>` : ''}
  <button class="ghost star" data-action="save" data-formula="${r.formula}" aria-pressed="${s.saved.includes(r.formula!)}">${s.saved.includes(r.formula!) ? '★ Saved' : '☆ Save compound'}</button>
  <div class="mol-wrap">${renderMoleculeSlot(r.molecule)}</div>
  <section class="panel"><h3>Molecule Breakdown</h3>
    ${r.atoms!.map((a) => `<div class="b-row"><span class="dot" style="background:${atomColor(a.symbol)}"></span><span>${ELEMENT_BY_SYMBOL[a.symbol].name} (${a.symbol})</span><span>${a.count}</span><span>${formatMass(a.mass)}</span></div>`).join('')}
    <div class="b-total"><span>Total Molar Mass</span><b>${formatMass(r.molarMass!)}</b></div></section>
  <section class="panel"><h3>About ${r.name} (${formatFormula(r.formula!)})</h3>
    ${r.description!.split('\n\n').map((p) => `<p>${formatFormula(escapeHtml(p))}</p>`).join('')}</section>
  <section class="panel"><h3>Why does this form?</h3>${r.explanation!.map((p) => `<p>${formatFormula(escapeHtml(p))}</p>`).join('')}
    ${r.conditions ? `<p class="muted">Typical conditions: ${r.conditions.temperature} °C, ${r.conditions.pressure} atm${r.conditions.catalyst ? `, ${r.conditions.catalyst} catalyst` : ''}. ${escapeHtml(r.conditions.note ?? '')}</p>` : ''}</section>
  ${renderLabNotes(r)}`;
}

function renderAmounts(r: ReactionResult): string {
  const lim = r.limiting ? ` · ${r.limiting.name} runs out first` : '';
  if (r.continuous) { // grams / moles mode: theoretical yield and leftover mass
    const left = r.leftovers?.length ? ` · Left over: ${r.leftovers.map((l) => `${formatAmount(l.grams!)} g ${l.name.toLowerCase()}`).join(', ')}` : '';
    return `<p class="amounts"><b>Theoretical yield: ${formatAmount(r.productGrams!)} g ${formatFormula(r.formula!)}</b> (${formatAmount(r.amount!)} mol)${left}${lim}</p>`;
  }
  const made = r.amount ?? 1;
  if (made <= 1 && !r.leftovers?.length) return '';
  const left = r.leftovers?.length ? ` · Left over: ${r.leftovers.map((l) => `${l.count} ${l.symbol}`).join(', ')}` : '';
  return `<p class="amounts"><b>Makes ${made} × ${formatFormula(r.formula!)}</b>${left}${lim}</p>`;
}

/** Heat, what you'd observe, and a safety reminder. Only shown when there is something recorded. */
function renderLabNotes(r: ReactionResult): string {
  const h = r.enthalpy;
  if (!h && !r.observations?.length && !r.reversible) return '';
  const heat = h
    ? `<p class="heat ${h.kind}"><b>${h.kind === 'exothermic' ? '🔥 Exothermic: releases heat' : h.kind === 'endothermic' ? '❄ Endothermic: absorbs heat' : 'Almost no heat change'}</b>
       <br>${Math.abs(h.total)} kJ for ${formatFormula(r.equation ?? '')} (${Math.abs(h.perMoleProduct)} kJ per mole of ${formatFormula(r.formula!)}). Standard values at 25 °C.${h.forAmount !== undefined ? ` For your amounts: ${h.forAmount < 0 ? 'releases' : 'absorbs'} about ${formatAmount(Math.abs(h.forAmount))} kJ.` : ''}</p>` : '';
  const s = r.stateAtConditions;
  // The tabulated heat assumes the product is in its 25 °C state; say so when it isn't.
  const caveat = h && s && s.state !== r.state && s.state !== 'Decomposes'
    ? `<p class="muted tiny">The heat above assumes ${formatFormula(r.formula!)} as a ${(r.state ?? "").toLowerCase()}. At ${s.temperature} °C it is a ${s.state.toLowerCase()}, so the real heat released is different.</p>` : '';
  const starts = r.reactantStates?.length
    ? `<p class="muted">At ${r.temperature} °C: ${r.reactantStates.map((x) => `${x.name.toLowerCase()} is ${x.state === 'Decomposes' ? 'unstable' : `a ${x.state.toLowerCase()}`}`).join(', ')}.</p>` : '';
  const obs = r.observations?.length ? `<ul class="obs">${r.observations.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>` : '';
  const rev = r.reversible ? '<p class="muted">This reaction is reversible (⇌): in practice only part of the reactants is converted at a time.</p>' : '';
  return `<section class="panel"><h3>Lab notes</h3>${heat}${caveat}${starts}${obs}${rev}
    <p class="muted tiny">For learning only. Observations and hazards are simplified; never attempt these reactions without supervision and proper safety equipment.</p></section>`;
}
