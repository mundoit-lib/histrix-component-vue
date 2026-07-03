/**
 * @file Utilidades puras sobre objetos de "values" (estado del form / filas).
 */

/**
 * Devuelve una copia del objeto sin las claves "sin valor".
 *
 * "Sin valor" = string vacío, null o undefined. Se conservan a propósito los
 * valores "falsy pero con dato": `0`, `'0'`, `false` (p. ej. checkboxes o
 * totales en cero), porque SÍ son un valor.
 *
 * Se usa para no mandar campos vacíos en las requests (p. ej. la ayuda manda el
 * estado del form, pero los campos vacíos no aportan y ensucian la query).
 *
 * @param {Object<string, any>} obj
 * @returns {Object<string, any>}
 */
export function compactValues(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') {
    return out;
  }
  for (const key in obj) {
    const value = obj[key];
    if (value === '' || value === null || value === undefined) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Devuelve una copia del objeto sin las claves indicadas.
 *
 * Se usa, p. ej., para no mandar el campo de la ayuda como value cuando ya viaja
 * en `__help` (+ `term`): el valor del propio campo sería redundante.
 *
 * @param {Object<string, any>} obj
 * @param {...(string|null|undefined)} keys claves a excluir (los vacíos se ignoran)
 * @returns {Object<string, any>}
 */
export function omit(obj, ...keys) {
  const out = {};
  if (!obj || typeof obj !== 'object') {
    return out;
  }
  const drop = new Set(keys.filter((key) => key != null && key !== ''));
  for (const key in obj) {
    if (drop.has(key)) {
      continue;
    }
    out[key] = obj[key];
  }
  return out;
}

/**
 * Devuelve una copia del objeto con SÓLO las claves indicadas (las que existan).
 *
 * Se usa para mandar únicamente los `context_fields` que pide el backend en la
 * request de ayuda (el resto del estado del form no se envía).
 *
 * @param {Object<string, any>} obj
 * @param {Array<string>} keys claves a conservar
 * @returns {Object<string, any>}
 */
export function pick(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) {
    return out;
  }
  for (const key of keys) {
    if (key == null || key === '') {
      continue;
    }
    if (key in obj) {
      out[key] = obj[key];
    }
  }
  return out;
}
