import { normalizeFieldType } from './normalize.js';

/**
 * Tipos de dato (`histrix_type` normalizado) que el componente distingue por
 * su clave: `isDate`, `isTime`, `isDateTime`, `isDecimal`, validación email.
 * No cambian el componente Vue (siguen siendo QInput).
 */
const DATA_KINDS = new Set(['date', 'time', 'datetime', 'decimal', 'integer', 'email']);

/**
 * Decisión pura del "tipo de campo" (qué clase de input es) a partir del
 * fieldSchema, sin depender del estado reactivo del componente.
 *
 * Decide sólo con lo que el backend emite: `histrix_type` (nombre de la clase
 * PHP, normalizado con `normalizeFieldType`), las opciones y el helper anidado.
 * Cada `if` puede sobrescribir el valor previo: el último que matchea gana.
 *
 * Claves devueltas (las compara HistrixField y su map kind -> QComponent):
 *   - 'q-input'  (default)
 *   - 'date' | 'time' | 'datetime' | 'decimal' | 'integer' | 'email'
 *                (tipos de dato, siguen renderizando QInput)
 *   - 'q-select' (tiene options / options_sorted / isSelect)
 *   - 'radio'    (Radio)
 *   - 'object'   (innerContainer presente y sin options)
 *   - 'q-file'   (File)
 *   - 'q-editor' (Editor, Simpleditor)
 *   - 'check'    (Check)
 *   - 'toggle'   (Flipswitch)
 *
 * @param {Partial<import('../../types').HistrixFieldSchema>} fieldSchema schema del campo ({ ...schema, ...rowSchema }).
 * @param {string} [defaultType='q-input'] valor base (this.type en el componente).
 * @returns {string} clave del tipo de input.
 */
export function resolveFieldKind(fieldSchema, defaultType = 'q-input') {
  const schema = fieldSchema || {};
  const histrixType = normalizeFieldType(schema.histrix_type);

  let type = defaultType;

  if (DATA_KINDS.has(histrixType)) {
    type = histrixType;
  }

  if (hasOptions(schema)) {
    type = 'q-select';
  }

  if (histrixType === 'radio') {
    type = 'radio';
  }

  if (renderHelper(schema)) {
    type = 'object';
  }

  if (histrixType === 'file') {
    type = 'q-file';
  }

  if (histrixType === 'editor') {
    type = 'q-editor';
  }

  if (histrixType === 'check') {
    type = 'check';
  }

  if (histrixType === 'flipswitch') {
    type = 'toggle';
  }

  return type;
}

/**
 * ¿El campo tiene opciones (es un select)?
 * Réplica pura del computed `hasOptions` del componente.
 * @param {Partial<import('../../types').HistrixFieldSchema>} fieldSchema
 * @returns {boolean}
 */
export function hasOptions(fieldSchema) {
  const schema = fieldSchema || {};
  const opt = schema.options_sorted ?? schema.options;
  return Boolean((opt && Object.keys(opt).length !== 0) || schema.isSelect);
}

/**
 * ¿Hay que renderizar el helper anidado (object)?
 * Réplica pura del computed `renderHelper` del componente.
 * @param {Partial<import('../../types').HistrixFieldSchema>} fieldSchema
 * @returns {boolean}
 */
export function renderHelper(fieldSchema) {
  const schema = fieldSchema || {};
  return Boolean(schema.innerContainer && !hasOptions(schema));
}
