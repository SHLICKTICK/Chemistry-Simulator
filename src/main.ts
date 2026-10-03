import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import { ELEMENTS } from './data/elements';
import { COMPOUNDS, COMPOUND_BY_FORMULA } from './data/compounds';
import { PRESETS } from './data/presets';
import type { ExperimentRecord } from './models';
import { registerPwa } from './services/pwa';
import { addExperiment, clearHistory, clearSaved, getPrefs, listExperiments, listSaved, saveCompound, setPrefs, unsaveCompound } from './services/storage';
import { combine } from './engine/reaction-engine';
import { renderHeader } from './components/Header';
import { renderHistory, renderLibrary, renderReactions, renderSettings } from './components/ListViews';
import { renderPeriodic } from './components/PeriodicTable';
import { mountMolecule, resetView, unmountMolecule } from './components/MoleculeViewer';
import { renderResult } from './components/ReactionResult';
import { renderWorkspace } from './components/ReactionWorkspace';
import { renderSidebar } from './components/Sidebar';
import { getState, setState, subscribe, toRecord, type View } from './state/app-state';
import { MAX_QUANTITY } from './utils/validation';

const $ = (id: string) => document.getElementById(id)!;
const clamp = (n: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(n) || 1));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let lastResult: unknown = Symbol();
let lastReacting = false;
let lastSaved = false;

/** Rebuild the result panel only when it actually changed, so the WebGL scene isn't recreated needlessly. */
function renderResultPanel(): void {
  const s = getState();
  const saved = !!s.currentResult?.formula && s.saved.includes(s.currentResult.formula);
  if (s.currentResult === lastResult && s.reacting === lastReacting && saved === lastSaved) return;
  lastResult = s.currentResult;
  lastReacting = s.reacting;
  lastSaved = saved;
  unmountMolecule();
  $('result').innerHTML = renderResult(s);
  const host = document.getElementById('mol3d');
  if (host && s.currentResult?.molecule) void mountMolecule(host, s.currentResult.molecule);
}

function render(): void {
  const s = getState();
  $('app').dataset.view = s.activeView;
  $('sidebar').innerHTML = renderSidebar(s.activeView);
  const views: Record<View, () => string> = {
    simulation: () => renderWorkspace(s), periodic: () => renderPeriodic(s),
    reactions: renderReactions, library: () => renderLibrary(s), history: () => renderHistory(s), settings: () => renderSettings(s),
  };
  const main = $('main');
  const y = main.scrollTop;
  main.innerHTML = views[s.activeView]();
  main.scrollTop = y;
  renderResultPanel();
}

function toggle(sym: string): void {
  const s = getState();
  const has = s.selectedElements.some((r) => r.element === sym);
  setState({ selectedElements: has ? s.selectedElements.filter((r) => r.element !== sym) : [...s.selectedElements, { element: sym, quantity: 1 }], currentResult: null });
}

async function record(rec: ExperimentRecord): Promise<void> {
  const last = getState().history[0];
  const key = (r: ExperimentRecord) => JSON.stringify([r.reactants, r.conditions, r.formula]);
  if (last && key(last) === key(rec)) return; // don't log identical back-to-back runs
  await addExperiment(rec);
  setState({ history: await listExperiments() });
}

function runCombine(): void {
  const s = getState();
  const input = toRecord(s.selectedElements);
  const conditions = s.idealConditions ? null : { ...s.conditions };
  const result = combine(input, conditions);
  const animate = s.prefs.animations && !reduceMotion();
  setState({ reacting: true, currentResult: null, animationTarget: animate && result.success ? (result.molecule ?? null) : null });
  // Short, subtle sequence: atoms gather and bond, then the engine's answer appears.
  setTimeout(() => {
    setState({ reacting: false, animationTarget: null, currentResult: result });
    if (getState().prefs.saveHistory)
      void record({ timestamp: Date.now(), reactants: input, conditions, success: result.success, formula: result.formula, name: result.name, equation: result.equation ?? result.recognisedEquation });
  }, animate ? 1100 : 0);
}

document.addEventListener('click', (ev) => {
  const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!t) return;
  const s = getState(), sym = t.dataset.symbol!;
  switch (t.dataset.action) {
    case 'nav': ev.preventDefault(); setState({ activeView: t.dataset.view as View }); break;
    case 'toggle': case 'add': toggle(sym); break;
    case 'inspect':
      setState({ inspected: sym });
      document.querySelector('.detail')?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
      break;
    case 'qty': setState({ currentResult: null, selectedElements: s.selectedElements.map((r) => (r.element === sym ? { ...r, quantity: clamp(r.quantity + Number(t.dataset.delta)) } : r)) }); break;
    case 'preset': setState({ activeView: 'simulation', currentResult: null, selectedElements: Object.entries(PRESETS[Number(t.dataset.index)].reactants).map(([element, quantity]) => ({ element, quantity })) }); break;
    case 'combine': runCombine(); break;
    case 'reset-view': resetView(); break;
    case 'save': {
      const f = t.dataset.formula!, has = s.saved.includes(f);
      setState({ saved: has ? s.saved.filter((x) => x !== f) : [...s.saved, f] });
      void (has ? unsaveCompound(f) : saveCompound({ formula: f, name: COMPOUND_BY_FORMULA[f]?.name ?? f, savedAt: Date.now() }));
      break;
    }
    case 'rerun': {
      const h = s.history.find((x) => x.id === Number(t.dataset.id));
      if (!h) break;
      setState({ activeView: 'simulation', currentResult: null, idealConditions: h.conditions === null, conditions: h.conditions ?? s.conditions,
        selectedElements: Object.entries(h.reactants).map(([element, quantity]) => ({ element, quantity })) });
      runCombine();
      break;
    }
    case 'clear-history': setState({ history: [] }); void clearHistory(); break;
    case 'clear-saved': setState({ saved: [] }); void clearSaved(); break;
    case 'reset': setState({ selectedElements: [], currentResult: null, reacting: false }); break;
  }
});

document.addEventListener('change', (ev) => {
  const el = ev.target as HTMLInputElement, sym = el.dataset.qtyInput;
  const s = getState();
  if (el.dataset.pref) {
    const prefs = { ...s.prefs, [el.dataset.pref]: el.checked };
    setState({ prefs });
    void setPrefs(prefs);
    return;
  }
  if ('condIdeal' in el.dataset) return setState({ idealConditions: el.checked, currentResult: null });
  if (el.dataset.cond) {
    const key = el.dataset.cond as 'temperature' | 'pressure';
    const [lo, hi] = key === 'temperature' ? [-50, 2000] : [0.1, 300];
    const v = Math.min(hi, Math.max(lo, Number(el.value) || s.conditions[key]));
    return setState({ conditions: { ...s.conditions, [key]: v }, currentResult: null });
  }
  if ('condCatalyst' in el.dataset) return setState({ conditions: { ...s.conditions, catalyst: el.value || undefined }, currentResult: null });
  if (!sym) return;
  const q = clamp(Number(el.value));
  setState({ currentResult: null, selectedElements: getState().selectedElements.map((r) => (r.element === sym ? { ...r, quantity: q } : r)) });
});

$('header').innerHTML = renderHeader();
$('search').addEventListener('input', (ev) => {
  const q = (ev.target as HTMLInputElement).value;
  const first = ELEMENTS.find((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()) || e.symbol.toLowerCase() === q.trim().toLowerCase());
  const ql = q.trim().toLowerCase();
  const compound = COMPOUNDS.some((c) => c.name.toLowerCase().includes(ql) || c.formula.toLowerCase() === ql);
  // Elements win; otherwise a compound match opens the Library.
  const view = !ql ? getState().activeView : first ? 'periodic' : compound ? 'library' : getState().activeView;
  setState({ searchQuery: q, activeView: view, inspected: ql && first ? first.symbol : getState().inspected });
});
subscribe(render);
render();
registerPwa();

// Load persisted data after the first paint so the app is usable immediately.
void Promise.all([listExperiments(), listSaved(), getPrefs()]).then(([history, saved, prefs]) => setState({ history, saved: saved.map((c) => c.formula), prefs }));
