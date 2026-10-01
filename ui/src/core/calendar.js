/**
 * calendar.js — lógica pura de HistrixCalendar, SIN depender de Quasar/QCalendar.
 *
 * El backend (`View/Calendar.php` + `ApplicationController`) recibe `_dt` +
 * `start` + `end` (ISO `YYYY-MM-DD`) y devuelve el array de eventos del rango:
 * `{id, title, fulltitle, allDay, start, end, editable, dataObject, color, textColor}`.
 * `start`/`end` del evento vienen como `YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss`, y
 * `title`/`fulltitle` pasan por `htmlspecialchars`.
 */

import { formatLocal } from './dates.js';

/** Margen (en días) que se pide antes y después del rango visible. */
export const RANGE_MARGIN_DAYS = 7;

/** ISO `YYYY-MM-DD` → Date local (sin corrimiento de huso). */
function isoToDate(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Suma `days` días a una fecha ISO y devuelve otra fecha ISO. */
export function addDays(iso, days) {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return formatLocal(d, 'YYYY-MM-DD');
}

/**
 * `calendarDefaultView` del XML (nombres de FullCalendar) → vista de QCalendar.
 * `gantt` no tiene equivalente y se muestra como semana.
 * @param {string} [defaultView]
 * @returns {'month'|'week'|'day'}
 */
export function mapDefaultView(defaultView) {
  switch (defaultView) {
    case 'basicWeek':
    case 'agendaWeek':
    case 'week':
    case 'gantt':
      return 'week';
    case 'basicDay':
    case 'agendaDay':
    case 'day':
      return 'day';
    default:
      return 'month';
  }
}

/**
 * Rango a pedir al backend: el visible (lo que informa el `@change` de
 * QCalendar) más un margen a cada lado.
 * @param {string} start primer día visible (ISO)
 * @param {string} end último día visible (ISO)
 * @param {number} [margin=RANGE_MARGIN_DAYS]
 * @returns {{start: string, end: string}}
 */
export function rangeWithMargin(start, end, margin = RANGE_MARGIN_DAYS) {
  return { start: addDays(start, -margin), end: addDays(end, margin) };
}

/**
 * ¿El rango `[start, end]` ya está cubierto por alguno de los cargados?
 * @param {{start: string, end: string}[]} loaded
 * @param {string} start
 * @param {string} end
 */
export function isRangeLoaded(loaded, start, end) {
  return loaded.some((r) => r.start <= start && r.end >= end);
}

/**
 * Agrega eventos nuevos a los ya cargados sin duplicar. El backend no garantiza
 * `id` único (los recurrentes repiten id), así que la clave es `id` + `start`.
 * @param {object[]} current
 * @param {object[]} incoming
 */
export function mergeEvents(current, incoming) {
  const byKey = new Map(current.map((e) => [`${e.id}|${e.start}`, e]));
  for (const e of incoming) byKey.set(`${e.id}|${e.start}`, e);
  return [...byKey.values()];
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#39;': "'" };

/** Revierte el `htmlspecialchars` que el backend aplica a los títulos. */
export function decodeEntities(str) {
  if (!str) return '';
  return String(str).replace(/&(amp|lt|gt|quot|#0?39);/g, (m) => ENTITIES[m]);
}

/**
 * Normaliza un evento del backend para la vista: fecha y hora separadas,
 * títulos decodificados y colores.
 * @param {object} ev evento crudo del backend
 */
export function normalizeEvent(ev) {
  const start = ev.start || '';
  const end = ev.end || start;
  const startTime = start.length > 10 ? start.slice(11, 16) : '';
  const endTime = end.length > 10 ? end.slice(11, 16) : '';
  const title = decodeEntities(ev.title);
  return {
    ...ev,
    title,
    fulltitle: decodeEntities(ev.fulltitle) || title,
    date: start.slice(0, 10),
    endDate: end.slice(0, 10) || start.slice(0, 10),
    time: ev.allDay ? '' : startTime,
    endTime: ev.allDay ? '' : endTime,
    color: ev.color || '',
    textColor: ev.textColor || ''
  };
}

/** `HH:mm` → minutos desde las 00:00. */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Duración en minutos de un evento con hora (mínimo 30, para que se vea).
 * Si termina otro día o no tiene hora de fin, se corta al final del día.
 */
export function eventDurationMinutes(ev) {
  if (!ev.time) return 0;
  const startMin = timeToMinutes(ev.time);
  const endMin = ev.endTime && ev.endDate === ev.date ? timeToMinutes(ev.endTime) : 24 * 60;
  return Math.max(endMin - startMin, 30);
}

/**
 * Payload de `select-row` para un evento, con la misma forma que emite
 * HistrixTable (`{ row, schema }`). `null` si el evento no trae `dataObject`.
 */
export function eventSelectPayload(ev, schema) {
  const row = ev?.dataObject;
  if (!row || typeof row !== 'object' || Object.keys(row).length === 0) return null;
  return { row, schema };
}
