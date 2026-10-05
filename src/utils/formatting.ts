/** "Ca(OH)2" → "Ca(OH)<sub>2</sub>" (also works inside equations like "2H2 + O2"). */
export const formatFormula = (f: string): string => f.replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>');
export const formatMass = (m: number): string => `${m.toFixed(3)} g/mol`;
export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** "[Ar] 3d10 4s1" → "[Ar] 3d<sup>10</sup> 4s<sup>1</sup>" */
export const formatConfig = (c: string): string => c.replace(/(\d[spdf])(\d+)/g, '$1<sup>$2</sup>');
/** Abundance percentage for display: 99.9855 → "99.99%", 0.0117 → "0.012%". */
export const formatPercent = (p: number): string => (p >= 99.995 ? '100%' : p >= 1 ? `${p.toFixed(2)}%` : p >= 0.01 ? `${p.toFixed(2)}%` : `${p.toPrecision(2)}%`);

/** 4 significant digits: 17.8153 → "17.82", 0.016 → "0.016", 1234.5 → "1,235". */
export const formatAmount = (n: number): string => n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
