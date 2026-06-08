/**
 * Decisión pura del "tipo de campo" (qué clase de input es) a partir del
 * fieldSchema, sin depender del estado reactivo del componente.
 *
 * Extraído de HistrixField.vue (computed `histrixType`). Replica EXACTAMENTE
 * el orden y la prioridad de las condiciones originales para no cambiar el
 * comportamiento: cada `if` puede sobrescribir el valor previo, por lo que el
 * último que matchea gana.
 *
 * Devuelve la MISMA clave string que usaba el componente, de modo que todas
 * las comparaciones aguas abajo (`=== 'radio'`, `=== 'q-select'`, etc.) y el
 * map kind -> QComponent sigan funcionando idénticos:
 *   - 'q-input'  (default)
 *   - 'q-select' (tiene options / options_sorted / isSelect, o TipoDato 'select')
 *   - 'radio'    (histrix_type 'Radio')
 *   - 'q-file'   (histrix_type 'File')
 *   - 'q-editor' (histrix_type 'Editor')
 *   - 'check'    (histrix_type 'Check')
 *   - 'toggle'   (histrix_type 'Flipswitch')
 *   - 'object'   (innerContainer presente y sin options)
 *   - además, cualquier valor de fieldSchema.TipoDato (p. ej. 'date', 'time',
 *     'datetime', 'decimal', 'integer') cuando no es pisado por una condición
 *     posterior.
 *
 * @param {object} fieldSchema schema del campo ({ ...schema, ...rowSchema }).
 * @param {string} [defaultType='q-input'] valor base (this.type en el componente).
 * @returns {string} clave del tipo de input.
 */
export function resolveFieldKind(fieldSchema, defaultType = 'q-input') {
  const schema = fieldSchema || {};

  let type = defaultType;

  if (hasOptions(schema)) {
    type = 'q-select';
  }

  if (schema.histrix_type === 'Radio') {
    type = 'radio';
  }

  if (schema.TipoDato) {
    type = schema.TipoDato;
  }

  if (type === 'select') {
    type = 'q-select';
  }

  if (renderHelper(schema)) {
    type = 'object';
  }

  if (schema.histrix_type === 'File') {
    type = 'q-file';
  }

  if (schema.histrix_type === 'Editor') {
    type = 'q-editor';
  }

  if (schema.histrix_type === 'Check') {
    type = 'check';
  }

  if (schema.histrix_type === 'Flipswitch') {
    type = 'toggle';
  }

  return type;
}

/**
 * ¿El campo tiene opciones (es un select)?
 * Réplica pura del computed `hasOptions` del componente.
 * @param {object} fieldSchema
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
 * @param {object} fieldSchema
 * @returns {boolean}
 */
export function renderHelper(fieldSchema) {
  const schema = fieldSchema || {};
  return Boolean(schema.innerContainer && !hasOptions(schema));
}
