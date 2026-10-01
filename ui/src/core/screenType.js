/**
 * Resolución pura del "tipo de pantalla" (kind) a partir de `schema.type`.
 *
 * Histrix describe cada pantalla con un `schema.type` (ficha, consulta, crud,
 * arbol, chart, calendar, dashboard, list, etc.). Este módulo sólo toma la
 * DECISIÓN: mapea cada tipo a una clave de pantalla (`kind`). El componente
 * Vue concreto se resuelve en HistrixApp.
 *
 * `schema.type` llega crudo del XML, así que primero pasa por
 * `normalizeScreenType` (minúsculas, sin guiones, typos corregidos): las
 * claves del mapa están en esa forma canónica.
 *
 * Agrupamiento:
 *   - HistrixForm      → 'form'      (ficha, fichaing, cabecera)
 *   - HistrixTable     → 'table'     (consulta, crud, abm, abm-mini, ing, grid,
 *                                     liveGrid, ayuda, help)
 *   - HistrixTree      → 'tree'      (arbol, tree)
 *   - HistrixChart     → 'chart'     (chart)
 *   - HistrixCalendar  → 'calendar'  (calendar, gantt)
 *   - HistrixDashboard → 'dashboard' (dashboard)
 *   - HistrixList      → 'list'      (list)
 *   - sin componente todavía: 'map', 'treeview', 'treetable', 'orgchart',
 *     'card', 'kanban', 'horizontalgrid' (HistrixApp muestra HistrixUnsupported)
 */

import { normalizeScreenType } from './normalize.js';

/**
 * @typedef {'form'|'table'|'chart'|'tree'|'calendar'|'dashboard'|'list'
 *   |'map'|'treeview'|'treetable'|'orgchart'|'card'|'kanban'|'horizontalgrid'} ScreenKind
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
  chart: 'chart',
  // HistrixList
  list: 'list',
  // HistrixTable
  consulta: 'table',
  crud: 'table',
  abm: 'table',
  abmmini: 'table',
  ing: 'table',
  grid: 'table',
  livegrid: 'table',
  help: 'table',
  ayuda: 'table',
  // Sin componente todavía
  map: 'map',
  treeview: 'treeview',
  treetable: 'treetable',
  orgchart: 'orgchart',
  card: 'card',
  kanban: 'kanban',
  horizontalgrid: 'horizontalgrid'
};

/**
 * Devuelve el kind de pantalla para un `schema.type`, o `null` si no se conoce.
 * @param {import('../../types').HistrixScreenType} type `schema.type` tal cual llega (cualquier grafía).
 * @returns {ScreenKind|null}
 */
export function resolveScreenKind(type) {
  return SCREEN_TYPE_TO_KIND[normalizeScreenType(type)] ?? null;
}
