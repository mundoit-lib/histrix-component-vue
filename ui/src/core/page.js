// Helpers puros de HistrixPage / HistrixAppDialog.

/**
 * Path del XML a partir de lo que entrega el router: string, o array de
 * segmentos en las rutas catch-all (`/:path(.*)*`). Sin barras iniciales repetidas.
 */
export function resolvePagePath(value) {
  const path = Array.isArray(value) ? value.join('/') : String(value || '');
  return path.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
}

/** Ancho del diálogo: número → px; string tal cual; vacío → sin estilo. */
export function dialogWidthStyle(width) {
  if (width === null || width === undefined || width === '') return {};
  const value = typeof width === 'number' ? `${width}px` : String(width);
  return { width: value, maxWidth: '95vw' };
}
