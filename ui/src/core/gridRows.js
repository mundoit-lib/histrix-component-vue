/**
 * gridRows.js — lógica pura de los renglones de las grillas de carga
 * (`ing`/`grid`/`liveGrid`).
 *
 * Cliente stateless: los renglones viven en `HistrixTable.data` hasta el
 * process del comprobante padre. Acá está lo que en el legacy hacían
 * `H.save`, `H.llenoForm` y `H.deleterow` contra la instancia del servidor:
 * numerar `_ORDEN`, reemplazar o agregar un renglón, borrarlo y renumerar,
 * los totales al pie y el checkbox de cabecera de una columna.
 *
 * Las celdas pueden venir planas o como objeto `{ value, _ }` (formato de la
 * API); todas las funciones respetan esa forma.
 */

/**
 * Valor plano de una celda (`{ value }`, `{ _ }` o el valor tal cual).
 *
 * @param {any} cell
 * @returns {any}
 */
export function cellValue(cell) {
  if (cell !== null && (typeof cell === 'object' || typeof cell === 'function')) {
    return cell.value !== undefined ? cell.value : cell._;
  }
  return cell;
}

/**
 * Escribe el valor de una celda conservando su forma: si es un objeto de la
 * API se actualiza su `value`; si no, se reemplaza.
 *
 * @param {Record<string, any>} row
 * @param {string} name
 * @param {any} value
 */
export function setCellValue(row, name, value) {
  const cell = row[name];
  if (cell !== null && (typeof cell === 'object' || typeof cell === 'function')) {
    cell.value = value;
  } else {
    row[name] = value;
  }
}

/** Máximo entero de una columna (0 si no hay ninguno). */
function maxOf(rows, read) {
  return (rows || []).reduce((acc, row) => {
    const n = Number.parseInt(read(row), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
}

/**
 * Siguiente `_ORDEN` para un renglón nuevo: máximo existente + 1 (no
 * `rows.length`, para no repetir si quedaron huecos).
 *
 * @param {Record<string, any>[]} rows
 * @returns {number}
 */
export function nextOrden(rows) {
  return maxOf(rows, (row) => cellValue(row._ORDEN)) + 1;
}

/**
 * Siguiente `_id` (row-key de la q-table) para un renglón nuevo. Con
 * `rows.length` se repetía el `_id` de otro renglón después de un borrado.
 *
 * @param {Record<string, any>[]} rows
 * @returns {number}
 */
export function nextRowId(rows) {
  if (!rows?.length) {
    return 0;
  }
  return maxOf(rows, (row) => row._id) + 1;
}

/**
 * Renumera `_ORDEN` 1..n en el orden actual, sólo en los renglones que
 * tienen la columna. Muta las filas (son las de la tabla).
 *
 * @param {Record<string, any>[]} rows
 * @returns {Record<string, any>[]} las mismas filas.
 */
export function renumberOrden(rows) {
  let orden = 0;
  for (const row of rows || []) {
    if (Object.prototype.hasOwnProperty.call(row, '_ORDEN')) {
      orden += 1;
      setCellValue(row, '_ORDEN', orden);
    }
  }
  return rows;
}

/**
 * Posición de un renglón por su `_id` (-1 si no está o no tiene `_id`).
 *
 * @param {Record<string, any>[]} rows
 * @param {any} id
 * @returns {number}
 */
export function rowIndexById(rows, id) {
  if (id === undefined || id === null) {
    return -1;
  }
  return (rows || []).findIndex((row) => row._id === id);
}

/**
 * Renglón confirmado: reemplaza al de igual `_id` o se agrega al final.
 * Muta `rows` y devuelve la posición donde quedó.
 *
 * @param {Record<string, any>[]} rows
 * @param {Record<string, any>} row
 * @returns {{ index: number, isNew: boolean }}
 */
export function upsertRow(rows, row) {
  const index = rowIndexById(rows, row._id);
  if (index >= 0) {
    rows.splice(index, 1, row);
    return { index, isNew: false };
  }
  rows.push(row);
  return { index: rows.length - 1, isNew: true };
}

/**
 * Borra el renglón de `_id` dado y renumera `_ORDEN`. Muta `rows`.
 *
 * @param {Record<string, any>[]} rows
 * @param {any} id
 * @returns {boolean} true si lo encontró.
 */
export function removeRow(rows, id) {
  const index = rowIndexById(rows, id);
  if (index < 0) {
    return false;
  }
  rows.splice(index, 1);
  renumberOrden(rows);
  return true;
}

/**
 * ¿La columna suma al pie? (`suma="true"` del XML viaja como `sum`).
 *
 * @param {{ sum?: any }} col
 * @returns {boolean}
 */
export function isSumColumn(col) {
  return col?.sum === true || col?.sum === 'true';
}

/**
 * Totales de las columnas `sum` y de las columnas origen de
 * `computedTotals` (`{ campoCabecera: columnaOrigen }`).
 *
 * @param {Record<string, any>[]} rows
 * @param {{ name: string, sum?: any }[]} columns
 * @param {Record<string, string>} [computedTotals]
 * @returns {Record<string, number>}
 */
export function columnTotals(rows, columns, computedTotals) {
  const sources = Object.values(computedTotals || {});
  const totals = {};
  for (const col of columns || []) {
    if (!isSumColumn(col) && !sources.includes(col.name)) {
      continue;
    }
    totals[col.name] = (rows || []).reduce((acc, row) => acc + (Number.parseFloat(cellValue(row[col.name])) || 0), 0);
  }
  return totals;
}

/**
 * ¿El valor de un check está marcado? Mismo criterio que HistrixField:
 * '' / '0' / 0 / false / null = desmarcado.
 *
 * @param {any} value
 * @returns {boolean}
 */
export function isChecked(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === '' || value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value !== '0';
  }
  return value !== 0;
}

/**
 * Estado del checkbox de cabecera de una columna: true (todas marcadas),
 * false (ninguna o sin filas) o null (mezcla, indeterminado).
 *
 * @param {Record<string, any>[]} rows
 * @param {string} name
 * @returns {boolean | null}
 */
export function headerCheckState(rows, name) {
  if (!rows?.length) {
    return false;
  }
  const checked = rows.filter((row) => isChecked(cellValue(row[name]))).length;
  if (checked === 0) {
    return false;
  }
  return checked === rows.length ? true : null;
}

/**
 * Marca o desmarca la columna en todas las filas. Muta las filas y devuelve
 * las que cambiaron (para que liveGrid guarde sólo esas).
 *
 * @param {Record<string, any>[]} rows
 * @param {string} name
 * @param {boolean} checked
 * @returns {Record<string, any>[]}
 */
export function setColumnChecked(rows, name, checked) {
  const changed = [];
  for (const row of rows || []) {
    if (isChecked(cellValue(row[name])) !== checked) {
      setCellValue(row, name, checked);
      changed.push(row);
    }
  }
  return changed;
}
