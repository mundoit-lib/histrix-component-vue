/**
 * keys.js — lógica pura de claves primarias del schema Histrix.
 *
 * Un campo es clave primaria cuando su schema tiene `esClave === 'true'`
 * (string literal proveniente del backend XML, NO booleano).
 *
 * Esta lógica de selección de campos clave estaba DUPLICADA idéntica en
 * HistrixForm.vue, HistrixTable.vue y HistrixTree.vue. Lo único que variaba
 * entre componentes era cómo cada uno lee el VALOR de la fila (localValues,
 * item[campo]._, item[campo].value, etc.), por eso la lectura del valor se
 * mantiene en cada wrapper y acá sólo vive la parte común y pura.
 */

/**
 * Devuelve los nombres de los campos marcados como clave primaria.
 *
 * @param {Object} fields - schema.fields ({ nombre: fieldSchema }).
 * @returns {string[]} nombres de los campos con esClave === 'true'.
 */
export function keyFieldNames(fields) {
  return Object.entries(fields || {})
    .filter((field) => field[1].esClave === 'true')
    .map((field) => field[0]);
}

/**
 * Extrae las claves primarias de una fila de datos.
 *
 * Filtra los campos del schema marcados como clave (esClave === 'true') y
 * devuelve un objeto { nombreCampo: item[nombreCampo] }. Si el campo clave
 * no existe en `item`, el valor resultante es `undefined` (igual que el
 * acceso directo a la propiedad). Si no hay claves, devuelve {}.
 *
 * @param {Object} item - fila de datos.
 * @param {Object} fields - schema.fields ({ nombre: fieldSchema }).
 * @returns {Object} { nombreCampo: valorEnLaFila }.
 */
export function extractKeys(item, fields) {
  const keyData = {};
  for (const name of keyFieldNames(fields)) {
    keyData[name] = item[name];
  }
  return keyData;
}
