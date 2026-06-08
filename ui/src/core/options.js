/**
 * options.js — normalización pura de OPTIONS (combos/selects) de Histrix.
 *
 * HistrixField recibe las opciones de un combo en TRES formatos distintos y
 * cada uno tiene su propio mapeo a un array normalizado de
 * `{ value, label, description, data }` (o `{ value, label }` / `{ value,
 * label, data }` cuando hay `helperPath`):
 *
 *   - mapRemoteOptions: respuesta remota (array de objetos), toma value/label
 *     por posición (1er y 2do campo) con fallback a las claves `value`/`label`.
 *   - mapOptions:       array (full_options), value = String(option._id),
 *     label = el propio elemento o su primer valor si es objeto.
 *   - mapDictOptions:   diccionario { key: label } (options / options_sorted),
 *     value = key con trim y coerción numérica, label = valor o su primer
 *     valor si es objeto.
 *
 * Las variantes NO son intercambiables: difieren en cómo derivan value, label
 * y data, y en cuándo aplican el orden. Por eso cada una se replica fiel.
 *
 * Estas funciones son PURAS: reciben las opciones y `helperPath` (truthiness
 * que en el componente proviene del computed `helperPath`) como parámetros y
 * devuelven `{ data, flat }`. La parte NO pura del componente —ordenar con
 * `this.orderData` (que depende de `this.formatDate`) y asignar
 * `this.optionFixed`— se mantiene en el wrapper.
 *
 * `flat` indica que las labels empiezan con una fecha dd/mm/yyyy: el
 * componente lo usa para decidir el criterio de orden (por fecha vs alfabético).
 */

// Regex de fecha dd/mm/yyyy (con `/` o `-`) usado para detectar el modo `flat`.
const DATE_RE = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;

/**
 * Determina si una label arranca con una fecha dd/mm/yyyy.
 * Replica EXACTAMENTE el chequeo `label.includes(' - ')` + regex sobre el
 * prefijo, idéntico en las tres variantes.
 *
 * @param {string} label
 * @returns {boolean}
 */
function labelStartsWithDate(label) {
  if (!label.includes(' - ')) return false;
  const temp = label.slice(0, label.indexOf(' - '));
  return !!temp.match(DATE_RE);
}

/**
 * Normaliza una respuesta remota (array de objetos).
 *
 * Replica `mapRemoteOptions`: por cada objeto recorre sus entries y toma como
 * `key` el 1er campo (con fallback a `optionData.value`) y como `label` el 2do
 * campo (con fallback a `optionData.label`). Descarta los items sin label.
 *
 * @param {Array<Object>} options - filas remotas.
 * @param {boolean} helperPath - truthiness del computed `helperPath`.
 * @returns {{ data: Array<Object>, flat: boolean }}
 */
export function mapRemoteOptions(options, helperPath) {
  const data = [];
  let flat = false;
  if (!options) return { data, flat };
  for (const optionData of options) {
    let counter = 0;
    let key = null;
    let label = '';
    for (const [, value] of Object.entries(optionData)) {
      if (counter === 0) {
        key = optionData.value ?? value;
      }
      if (counter === 1) {
        label = optionData.label ?? value;
      }
      counter++;
    }
    if (!label) continue;
    if (!flat && labelStartsWithDate(label)) flat = true;
    if (helperPath) {
      data.push({
        value: key,
        label
      });
    } else {
      data.push({
        value: key,
        label,
        description: label,
        data: optionData
      });
    }
  }
  return { data, flat };
}

/**
 * Normaliza un array de opciones (full_options).
 *
 * Replica `mapOptions`: `value = String(option._id)`; `label` es el propio
 * elemento, o su primer valor si es objeto/función no-nulo.
 *
 * @param {Array} options
 * @param {boolean} helperPath - truthiness del computed `helperPath`.
 * @returns {{ data: Array<Object>, flat: boolean }}
 */
export function mapArrayOptions(options, helperPath) {
  const data = [];
  let flat = false;
  if (options) {
    options.map((option) => {
      const key = String(option._id);
      //const key = option[0];
      let label = option;
      if ((typeof label === 'object' || typeof label === 'function') && label !== null) {
        label = label[Object.keys(label)[0]];
      }

      if (!flat && labelStartsWithDate(label)) flat = true;
      if (helperPath) {
        data.push({
          value: key,
          label
        });
      } else {
        data.push({
          value: key,
          label,
          description: label,
          data: option
        });
      }
    });
  }
  return { data, flat };
}

/**
 * Normaliza un diccionario de opciones `{ key: label }`
 * (`options` / `options_sorted`).
 *
 * Replica `mapOptionsOld`: `key = option[0]` con `.trim()` (las keys de
 * `options_sorted` vienen con un espacio antepuesto para forzar el orden, ver
 * docs/07 §8.1) y coerción a Number si el string es numérico; `label` es el
 * valor, o su primer valor si es objeto/función no-nulo. Cuando hay
 * `helperPath`, `data` es `option[1] ?? {}`; si no, `data` es la entry completa
 * `[key, value]` y se agrega `description = label`.
 *
 * @param {Object} options - diccionario { key: label }.
 * @param {boolean} helperPath - truthiness del computed `helperPath`.
 * @returns {{ data: Array<Object>, flat: boolean }}
 */
export function mapDictOptions(options, helperPath) {
  const data = [];
  let flat = false;
  if (options) {
    Object.entries(options).map((option) => {
      let key = option[0]?.trim?.() ?? option[0];
      if (key && !Number.isNaN(Number(key)) && typeof key === 'string') {
        key = Number(key);
      }
      let label = option[1];
      if ((typeof label === 'object' || typeof label === 'function') && label !== null) {
        label = label[Object.keys(label)[0]];
      }
      if (!flat && labelStartsWithDate(label)) flat = true;
      if (helperPath) {
        data.push({
          value: key,
          label,
          data: option[1] ?? {}
        });
      } else {
        data.push({
          value: key,
          label,
          description: label,
          data: option
        });
      }
    });
  }
  return { data, flat };
}
