/**
 * @file `data-formulas`: reglas dinámicas por campo (Histrix).
 *
 * El backend manda en cada field un atributo `data-formulas` como string JSON
 * (HTML-encodeado con `&quot;`), array de objetos:
 *   [{ "formula": "tipo_requerimiento_id_rao == 2",
 *      "targetField": "__REQUIRED", "ajaxupdate": "false" }]
 *
 * `targetField` es una DIRECTIVA sobre el campo (no un campo real):
 *   - __REQUIRED → el campo pasa a ser obligatorio si la fórmula da verdadero.
 *   - __VISIBLE  → el campo se muestra sólo si la fórmula da verdadero.
 *   - __ENABLED  → el campo se puede editar sólo si la fórmula da verdadero.
 *
 * Puede venir más de una fórmula (para la misma o distintas directivas).
 */

import { evaluateCondition } from './condition.js';

/** Decodifica las entidades HTML mínimas presentes en el atributo. */
function decodeEntities(str) {
  const map = { quot: '"', apos: "'", '#39': "'", '#34': '"', lt: '<', gt: '>', amp: '&' };
  return str.replace(/&(#?\w+);/g, (match, entity) => (entity in map ? map[entity] : match));
}

/**
 * Parsea el atributo `data-formulas` a un array de reglas.
 * Acepta el string JSON (encodeado o no) o un array ya parseado.
 *
 * @param {string|Array|undefined} raw
 * @returns {Array<{formula: string, targetField: string, ajaxupdate?: string}>}
 */
export function parseDataFormulas(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(decodeEntities(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Evalúa las reglas contra los valores actuales y devuelve las directivas que
 * aplican. Sólo incluye una clave si hay al menos una fórmula para esa directiva
 * (así el consumidor distingue "sin regla" de "regla que dio false").
 *
 * Combinación cuando hay varias fórmulas para una misma directiva:
 *   - required: OR  (cualquier fórmula verdadera lo vuelve obligatorio)
 *   - visible/enabled: AND (todas deben cumplirse para mostrar/habilitar)
 *
 * @param {Array} formulas resultado de parseDataFormulas.
 * @param {(name: string) => *} getValue resuelve un campo.
 * @returns {{ required?: boolean, visible?: boolean, enabled?: boolean }}
 */
export function computeFormulaFlags(formulas, getValue) {
  const flags = {};
  if (!Array.isArray(formulas)) return flags;
  for (const rule of formulas) {
    if (!rule || !rule.targetField || !rule.formula) {
      continue;
    }
    const on = evaluateCondition(rule.formula, getValue);
    switch (rule.targetField) {
      case '__REQUIRED':
        flags.required = (flags.required ?? false) || on;
        break;
      case '__VISIBLE':
        flags.visible = (flags.visible ?? true) && on;
        break;
      case '__ENABLED':
        flags.enabled = (flags.enabled ?? true) && on;
        break;
      default:
        break;
    }
  }
  return flags;
}
