/**
 * Resolución pura del "tipo de pantalla" (kind) a partir de `schema.type`.
 *
 * Histrix describe cada pantalla con un `schema.type` (ficha, consulta, crud,
 * tree, chart, calendar, dashboard, list, etc.). Históricamente HistrixApp
 * mezclaba esa DECISIÓN (qué clase de pantalla es) con el RENDER (qué componente
 * Vue montar) en un único objeto `type → defineLazyComponent(...)`.
 *
 * Este módulo extrae sólo la DECISIÓN: mapea cada `schema.type` a una clave de
 * tipo de pantalla (`kind`) string. El componente concreto a renderizar se
 * resuelve en el componente, manteniendo intactos los `defineLazyComponent`.
 *
 * El agrupamiento refleja EXACTAMENTE el mapa original de HistrixApp.vue:
 *   - HistrixForm     → 'form'      (ficha, fichaing, cabecera)
 *   - HistrixTable    → 'table'     (consulta, crud, abm, abm-mini, ing, grid,
 *                                    liveGrid, help, ayuda)
 *   - HistrixTree     → 'tree'      (tree, arbol)
 *   - HistrixChart    → 'chart'     (chart, map, treeView)
 *   - HistrixCalendar → 'calendar'  (calendar, gantt)
 *   - HistrixDashboard→ 'dashboard' (dashboard)
 *   - HistrixList     → 'list'      (list)
 */

/**
 * @typedef {'form'|'table'|'chart'|'tree'|'calendar'|'dashboard'|'list'} ScreenKind
 */

/** @type {Record<string, ScreenKind>} */
export const SCREEN_TYPE_TO_KIND = {
  // HistrixForm
  ficha: 'form',
  fichaing: 'form',
  cabecera: 'form',
  // HistrixCalendar
  calendar: 'calendar',
  gantt: 'calendar',
  // HistrixDashboard
  dashboard: 'dashboard',
  // HistrixTree
  tree: 'tree',
  arbol: 'tree',
  // HistrixChart
  treeView: 'chart',
  map: 'chart',
  chart: 'chart',
  // HistrixList
  list: 'list',
  // HistrixTable
  consulta: 'table',
  crud: 'table',
  abm: 'table',
  ing: 'table',
  grid: 'table',
  liveGrid: 'table',
  help: 'table',
  ayuda: 'table',
  'abm-mini': 'table'
};

/**
 * Devuelve el kind de pantalla para un `schema.type`, o `null` si no se conoce.
 * @param {string} type
 * @returns {ScreenKind|null}
 */
export function resolveScreenKind(type) {
  return SCREEN_TYPE_TO_KIND[type] ?? null;
}
