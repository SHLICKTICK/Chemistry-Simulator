import { ELEMENT_BY_SYMBOL } from '../data/elements';
import { getAtomicStructure, type AtomicStructure } from '../engine/atomic-structure';
import { formatConfig, formatPercent } from '../utils/formatting';

/** Bohr-style diagram: nucleus plus one ring per electron shell. The outermost valence electrons are highlighted. */
function renderShells(a: AtomicStructure, name: string): string {
  const n = a.shells.length, step = n > 1 ? Math.min(92 / (n - 1), 26) : 0, first = n === 1 ? 62 : 48;
  const rings: string[] = [], dots: string[] = [];
  a.shells.forEach((count, i) => {
    const r = first + i * step;
    rings.push(`<circle cx="150" cy="150" r="${r}" class="ring"/>`);
    const outer = i === n - 1;
    for (let k = 0; k < count; k++) {
      const ang = -Math.PI / 2 + (2 * Math.PI * k) / count + i * 0.35; // small stagger so rings don't line up
      const valence = outer && k < a.valenceElectrons;
      dots.push(`<circle cx="${(150 + r * Math.cos(ang)).toFixed(1)}" cy="${(150 + r * Math.sin(ang)).toFixed(1)}" r="${count > 24 ? 3 : 3.6}" class="${valence ? 'e-val' : 'e'}"/>`);
    }
  });
  return `<svg class="bohr" viewBox="0 0 300 300" role="img" aria-label="Simplified shell model of ${name}: ${a.shells.join(', ')} electrons in successive shells.">
    ${rings.join('')}<circle cx="150" cy="150" r="30" class="nucleus"/>
    <text x="150" y="146" text-anchor="middle" class="nuc-text">${a.protons}p</text><text x="150" y="160" text-anchor="middle" class="nuc-text">${a.neutrons}n</text>
    ${dots.join('')}</svg>`;
}

function isotopeText(a: AtomicStructure): string {
  const sym = a.symbol;
  if (!a.naturalIsotopes.length)
    return `${sym} has no naturally occurring isotopes. The neutron count above is for ${sym}-${a.massNumber}, a representative isotope, and it is radioactive.`;
  const abundant = a.naturalIsotopes.find(([m]) => m === a.massNumber);
  const others = a.naturalIsotopes.filter(([m]) => m !== a.massNumber).sort((x, y) => y[1] - x[1]).slice(0, 3);
  let t = `Most abundant isotope: ${sym}-${a.massNumber}${abundant ? ` (${formatPercent(abundant[1])})` : ''}.`;
  if (others.length) t += ` Others: ${others.map(([m, p]) => `${sym}-${m} (${formatPercent(p)})`).join(', ')}.`;
  else t += ' It has just one natural isotope.';
  if (a.radioactive) t += ` ${sym}-${a.massNumber} is radioactive, but so long-lived that it occurs naturally.`;
  return t;
}

export function renderAtomicStructure(symbol: string): string {
  const a = getAtomicStructure(symbol);
  if (!a) return '';
  const name = ELEMENT_BY_SYMBOL[symbol].name;
  return `<section class="structure" aria-labelledby="structure-title">
    <h3 id="structure-title">Atomic structure <small>neutral ${name} atom</small></h3>
    <div class="struct-body">
      <figure class="bohr-fig">${renderShells(a, name)}
        <figcaption><span class="key"><i class="e"></i>Electron</span><span class="key"><i class="e-val"></i>Valence electron</span></figcaption></figure>
      <div class="struct-info">
        <ul class="particles">
          <li class="p"><b>${a.protons}</b><span>Protons (p⁺)</span></li>
          <li class="n"><b>${a.neutrons}</b><span>Neutrons (n⁰)</span></li>
          <li class="e"><b>${a.electrons}</b><span>Electrons (e⁻)</span></li>
        </ul>
        <dl>
          <dt>Electrons per shell</dt><dd>${a.shells.join(', ')}</dd>
          <dt>Configuration</dt><dd class="config">${formatConfig(a.config)}</dd>
          <dt>Mass number</dt><dd>${a.massNumber} (${symbol}-${a.massNumber})</dd>
        </dl>
        <p class="note">${isotopeText(a)}</p>
        <p class="note">Simplified shell model: real electrons occupy orbitals rather than circular orbits.</p>
      </div>
    </div></section>`;
}
