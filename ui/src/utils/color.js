/**
 * Oscurece (factor < 0) o aclara (factor > 0) un color hex `#rrggbb`.
 * @param {string} hex Color en formato `#rrggbb`.
 * @param {number} factor Factor en el rango [-1, 1].
 * @returns {string} Color resultante en `#rrggbb` (o el original si no es válido).
 */
export function shade(hex, factor) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const num = Number.parseInt(h, 16);
  const t = factor < 0 ? 0 : 255;
  const p = Math.abs(factor);
  const r = Math.round(((num >> 16) & 0xff) * (1 - p) + t * p);
  const g = Math.round(((num >> 8) & 0xff) * (1 - p) + t * p);
  const b = Math.round((num & 0xff) * (1 - p) + t * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default { shade };
