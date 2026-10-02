/** "Ca(OH)2" → "Ca(OH)<sub>2</sub>" (also works inside equations like "2H2 + O2"). */
export const formatFormula = (f: string): string => f.replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>');
export const formatMass = (m: number): string => `${m.toFixed(3)} g/mol`;
export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
