import type { Molecule } from '../models';
import { atomColor } from '../utils/chemistry';

/** Atoms drift in from scattered start points to the product's positions, then bonds fade in. */
export function renderFormation(m: Molecule): string {
  const S = 62;
  const pts = m.atoms.map((a, i) => {
    const ang = i * 2.4 + 0.7;
    return { el: a.element, x: 160 + (a.position.x * Math.cos(0.5) + a.position.z * Math.sin(0.5)) * S, y: 120 - a.position.y * S, dx: Math.cos(ang) * 150, dy: Math.sin(ang) * 100 };
  });
  const bonds = m.bonds.map((b) => `<line class="f-bond" x1="${pts[b.from].x}" y1="${pts[b.from].y}" x2="${pts[b.to].x}" y2="${pts[b.to].y}"/>`).join('');
  const atoms = pts.map((p) => `<g class="f-atom" style="--dx:${p.dx}px;--dy:${p.dy}px"><circle cx="${p.x}" cy="${p.y}" r="${p.el === 'H' ? 20 : 28}" fill="${atomColor(p.el)}"/>
    <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" class="atom-label" fill="${p.el === 'H' ? '#1b2540' : '#fff'}">${p.el}</text></g>`).join('');
  return `<svg class="molecule formation" viewBox="0 0 320 240" aria-hidden="true">${bonds}${atoms}</svg>`;
}
