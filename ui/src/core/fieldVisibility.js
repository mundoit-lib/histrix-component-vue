/**
 * @file Decisiones puras de editabilidad/visibilidad de campos y columnas.
 *
 * Lógica extraída sin cambios de comportamiento desde:
 *  - HistrixForm.vue  -> método `isFieldEditable(field)`
 *  - HistrixTable.vue -> computed `visibleColumns`
 *
 * Toda dependencia del estado del componente (p. ej. `this.schema.type`) se
 * recibe como parámetro para mantener el módulo puro.
 */

/**
 * Decide si un campo NO debe mostrarse como editable.
 *
 * Semántica EXACTA del método original de HistrixForm:
 *   TRUE  = No mostrar / No editable
 *   FALSE = Mostrar / editable
 *
 * El método se usa como predicado de `filter(obj, predicate)` que descarta los
 * valores para los que el predicado devuelve `true`, de modo que devolver
 * `true` aquí significa "filtrar fuera (no editable)".
 *
 * @param {object} field      El fieldSchema del campo.
 * @param {string} schemaType El tipo del schema del componente (this.schema.type).
 * @returns {boolean} true si NO es editable; false si es editable.
 */
export function isFieldEditable(field, schemaType) {
  // Si editable es explícitamente falso (o falsy), no es editable
  if (!field.editable) return true;

  // Si hidden es falsy, es editable
  if (!field.hidden) return false;

  // Evaluar condiciones específicas para ciertos tipos
  const isSpecialType = schemaType !== 'fichaing' && schemaType !== 'cabecera';
  const isInnerContainer = field.innerContainer;
  const isNotSelect = !field.isSelect;
  const isExplicitlyNotEditable = field.editable === false;

  // Si cumple todas estas condiciones, no es editable
  if (isSpecialType && isInnerContainer && isNotSelect && isExplicitlyNotEditable) {
    return false;
  }
  // Si no cayó en ninguno de los casos anteriores, el campo es editable
  return true;
}

/**
 * Devuelve los nombres de las columnas visibles de una tabla.
 *
 * Semántica EXACTA del computed `visibleColumns` de HistrixTable: filtra las
 * columnas que no están ocultas (`hidden`) y que no tienen `display:none;` en su
 * `style`, y mapea cada una a su `name`.
 *
 * @param {Array<object>} columns Las columnas del schema (this.schema.columns).
 * @returns {Array<string>} Array de nombres de columnas visibles.
 */
export function visibleColumnNames(columns) {
  return columns
    .filter((column) => {
      return !column.hidden && !column.style.includes('display:none;');
    })
    .map((column, _index, _array) => {
      return column.name;
    });
}
