import { COMPOUNDS } from '../data/compounds';
import { REACTIONS } from '../data/reactions';
import { balance, formatEquation } from '../engine/equation-balancer';
import type { AppState } from '../state/app-state';
import { escapeHtml, formatFormula, formatMass } from '../utils/formatting';

export function renderReactions(): string {
  const rows = REACTIONS.map((r) => {
    const re = Object.keys(r.reactants), pr = Object.keys(r.products), c = balance(re, pr)!;
    return `<li><b>${formatFormula(formatEquation(re, pr, c))}</b><small>${r.conditions ? `${r.conditions.temperature} °C, ${r.conditions.pressure} atm${r.conditions.catalyst ? `, ${r.conditions.catalyst}` : ''}` : ''}</small></li>`;
  }).join('');
  return `<h1>Reactions</h1><p class="sub">Recorded reactions, balanced by the engine.</p><ul class="list">${rows}</ul>`;
}

export function renderLibrary(s: AppState): string {
  const q = s.searchQuery.trim().toLowerCase();
  const shown = q ? COMPOUNDS.filter((c) => c.name.toLowerCase().includes(q) || c.formula.toLowerCase().includes(q)) : COMPOUNDS;
  const rows = shown.map((c) => {
    const on = s.saved.includes(c.formula);
    return `<li><span><b>${formatFormula(c.formula)} — ${c.name}</b><br><small>${c.state} · ${formatMass(c.molarMass)}</small></span>
      <button class="ghost star" data-action="save" data-formula="${c.formula}" aria-pressed="${on}" aria-label="${on ? 'Unsave' : 'Save'} ${c.name}">${on ? '★ Saved' : '☆ Save'}</button></li>`;
  }).join('');
  return `<h1>Library</h1><p class="sub">${shown.length} of ${COMPOUNDS.length} compounds${q ? ` matching “${escapeHtml(s.searchQuery.trim())}”` : ''}. ${s.saved.length} saved.</p>${rows ? `<ul class="list">${rows}</ul>` : '<p class="empty">No compounds match your search.</p>'}`;
}

export function renderHistory(s: AppState): string {
  const rows = s.history.map((h) => {
    const suffix = h.unit === 'mol' ? ' mol' : h.unit === 'g' ? ' g' : '';
    const inputs = Object.entries(h.reactants).map(([e, n]) => `${e} × ${n}${suffix}`).join(' + ');
    const cond = h.conditions
      ? `${h.conditions.temperature} °C, ${h.conditions.pressure} atm${h.conditions.catalyst ? `, ${h.conditions.catalyst}` : ''}` : 'recommended conditions';
    return `<li class="hist"><span><b>${escapeHtml(inputs)}</b> → ${h.success ? `<b>${formatFormula(escapeHtml(h.formula ?? ''))}</b> ${escapeHtml(h.name ?? '')}` : '<span class="bad-text">no compound formed</span>'}
      <br><small>${new Date(h.timestamp).toLocaleString()} · ${cond}</small>${h.equation ? `<br><small>${formatFormula(escapeHtml(h.equation))}</small>` : ''}</span>
      <button class="ghost" data-action="rerun" data-id="${h.id}">Re-run</button></li>`;
  }).join('');
  return `<h1>Experiment History</h1><p class="sub">Your most recent experiments (up to 50), stored in this browser.</p>
    ${s.history.length ? `<ul class="list">${rows}</ul><div class="actions"><button class="ghost" data-action="clear-history">Clear history</button></div>`
    : '<p class="empty">No experiments yet. Run one from the Simulation view and it will appear here.</p>'}`;
}

export function renderSettings(s: AppState): string {
  return `<h1>Settings</h1><p class="sub">Preferences are stored locally in this browser.</p>
  <section class="cond settings">
    <label class="check-row"><input type="checkbox" data-pref="animations" ${s.prefs.animations ? 'checked' : ''} /> Play reaction animations</label>
    <label class="check-row"><input type="checkbox" data-pref="saveHistory" ${s.prefs.saveHistory ? 'checked' : ''} /> Save experiments to history</label>
    <div class="actions">
      <button class="ghost" data-action="clear-history" ${s.history.length ? '' : 'disabled'}>Clear history (${s.history.length})</button>
      <button class="ghost" data-action="clear-saved" ${s.saved.length ? '' : 'disabled'}>Clear saved compounds (${s.saved.length})</button>
    </div></section>`;
}
