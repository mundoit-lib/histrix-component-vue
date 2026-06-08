/**
 * dates.js — conversión de fechas del contrato Histrix, SIN depender de Quasar.
 *
 * Histrix habla fechas en formato argentino `dd/mm/yyyy` en ambas direcciones
 * (ver docs/07 §8.2). HistrixField mostraba la fecha en `DD/MM/YYYY` y grababa
 * en ISO `YYYY-MM-DD`, usando `date.formatDate` de Quasar para el formateo.
 *
 * Acá se extrae esa lógica reemplazando `date.formatDate` por un formateador
 * propio (`formatLocal`): para los dos únicos masks usados, formatear es
 * determinista (componentes locales del Date con padding), así que se elimina
 * la dependencia de Quasar sin cambiar el resultado.
 *
 * ⚠️ El ajuste `setMinutes(getMinutes() + getTimezoneOffset())` se preserva tal
 * cual del componente: es el workaround histórico de timezone. Por eso el
 * resultado depende del huso del entorno; los tests fijan TZ=UTC para ser
 * deterministas y la validación en huso real se hace en el playground.
 */

const DDMMYYYY_SWAP = /(\d{2})\/(\d{2})\/(\d{4})/;

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Reemplazo de `date.formatDate(date, mask)` de Quasar para los dos masks que
 * usa HistrixField. Usa los componentes LOCALES del Date (igual que Quasar).
 * @param {Date} d
 * @param {'DD/MM/YYYY'|'YYYY-MM-DD'} mask
 * @returns {string} fecha formateada, o '' si el Date es inválido.
 */
export function formatLocal(d, mask) {
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return mask === 'YYYY-MM-DD' ? `${yyyy}-${mm}-${dd}` : `${dd}/${mm}/${yyyy}`;
}

/** Aplica el ajuste de timezone histórico (preservado del componente). */
function adjustTz(d) {
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d;
}

/**
 * Valor de fecha del backend → string de display (`DD/MM/YYYY`).
 * Replica el getter `isDate` de HistrixField:
 *  - vacío / falsy → `undefined`
 *  - longitud ≠ 10 → se devuelve crudo (p. ej. el `-2` "sin fecha" de §8.2)
 *  - si trae `/`, intercambia día↔mes antes de parsear (para que `new Date` lo
 *    lea como mm/dd/yyyy), ajusta timezone y formatea.
 *
 * @param {string} modelValue valor crudo del backend.
 * @param {string} [displayMask='DD/MM/YYYY']
 * @returns {string|undefined}
 */
export function backendDateToDisplay(modelValue, displayMask = 'DD/MM/YYYY') {
  if (modelValue === '' || !modelValue) return undefined;
  if (modelValue.length !== 10) return modelValue;
  let value = modelValue;
  if (modelValue.includes('/')) {
    value = modelValue.replace(DDMMYYYY_SWAP, '$2/$1/$3');
  }
  const fecha = adjustTz(new Date(value));
  return formatLocal(fecha, displayMask);
}

/**
 * Valor de display → ISO `YYYY-MM-DD` para grabar en el backend.
 * Replica el setter `isDate` de HistrixField. Devuelve un objeto que indica si
 * el valor debe pasar crudo (cuando el display no mide 10, el setter original
 * emitía el valor sin convertir y disparaba `field-change`).
 *
 * @param {string} localValue valor que tipeó/eligió el usuario.
 * @param {string} [displayMask='DD/MM/YYYY']
 * @returns {{ passthrough: boolean, value: string }}
 */
export function displayDateToBackend(localValue, displayMask = 'DD/MM/YYYY') {
  let fecha;
  if (displayMask === 'DD/MM/YYYY') {
    if (localValue.length !== 10) {
      return { passthrough: true, value: localValue };
    }
    fecha = adjustTz(new Date(localValue.replace(DDMMYYYY_SWAP, '$2/$1/$3')));
  } else {
    fecha = adjustTz(new Date(localValue));
  }
  return { passthrough: false, value: formatLocal(fecha, 'YYYY-MM-DD') };
}

/**
 * Descompone una fecha `dd/mm/yyyy` en partes `[year, month+1, day]` (strings),
 * usado para ordenar combos por fecha. Replica el método `formatDate` del
 * componente. NOTA: el `month` lleva `+1` por el comportamiento original; se
 * preserva tal cual (sólo se usa para comparar entre sí, no para mostrar).
 *
 * @param {string} str fecha `dd/mm/yyyy`.
 * @returns {[string, number, string]} `[year, month+1, day]`.
 */
export function dateSortParts(str) {
  const year = str.slice(6, 10);
  const month = Number.parseInt(str.slice(3, 5)) + 1;
  const day = str.slice(0, 2);
  return [year, month, day];
}
