import { normalizeFieldType } from './normalize.js';

/**
 * Kinds numéricos (`histrix_type` normalizado): Decimal, Numeric, CustomNumeric,
 * Hfloat y EnclosedNumeric van a 'decimal'; Integer, Int y EnclosedInteger a 'integer'.
 */
const NUMERIC_KINDS = new Set(['decimal', 'integer']);

const DEFAULT_DECIMALS = 2;

/** Número JS "crudo" como lo manda el backend: punto decimal, sin miles. */
const PLAIN_NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

/**
 * @typedef {object} NumericSpec
 * @property {number} decimals cantidad de decimales a mostrar (0 si es entero).
 * @property {string} decimalSep separador decimal de display.
 * @property {string} thousandsSep separador de miles de display ('' = sin miles).
 * @property {boolean} negativeBrackets negativos entre paréntesis: (1.234,50).
 * @property {number|null} min
 * @property {number|null} max
 * @property {boolean} integer no admite decimales.
 */

/**
 * ¿El campo/columna es numérico (decimal o entero)?
 * @param {Partial<import('../../types').HistrixFieldSchema>} fieldSchema
 * @returns {boolean}
 */
export function isNumericField(fieldSchema) {
  return NUMERIC_KINDS.has(normalizeFieldType(fieldSchema?.histrix_type));
}

/**
 * Spec de formato de un campo numérico a partir de lo que emite el backend
 * (atributos de autoNumeric del legacy: `data-a-dec`, `data-a-sep`, `data-m-dec`,
 * `data-n-bracket`, `data-v-min`, `data-v-max`; y `decimales`, `min`, `max`).
 * Defaults es-AR: coma decimal, punto de miles, 2 decimales.
 * @param {Partial<import('../../types').HistrixFieldSchema>} fieldSchema
 * @returns {NumericSpec}
 */
export function numericSpec(fieldSchema) {
  const schema = fieldSchema || {};
  const integer = normalizeFieldType(schema.histrix_type) === 'integer';
  const decimalSep = schema['data-a-dec'] || ',';
  let thousandsSep = schema['data-a-sep'] ?? '.';
  if (thousandsSep === decimalSep) {
    thousandsSep = decimalSep === ',' ? '.' : ',';
  }
  return {
    decimals: integer ? 0 : (toInt(schema['data-m-dec']) ?? toInt(schema.decimales) ?? DEFAULT_DECIMALS),
    decimalSep,
    thousandsSep,
    negativeBrackets: isTruthyAttr(schema['data-n-bracket']),
    min: toNumber(schema['data-v-min'] ?? schema.min),
    max: toNumber(schema['data-v-max'] ?? schema.max),
    integer
  };
}

/**
 * Texto tipeado por el usuario → número. Tolera separadores de miles, la coma o
 * el punto como decimal (`'1.234,50'`, `'1234,5'`, `'1234.5'`), signo y negativos
 * entre paréntesis. Vacío → `null` (NULL ≠ 0); texto que no es número → `NaN`.
 * @param {string|number|null|undefined} text
 * @param {NumericSpec} spec
 * @returns {number|null}
 */
export function parseNumber(text, spec) {
  if (text === null || text === undefined) return null;
  if (typeof text === 'number') return Number.isFinite(text) ? text : Number.NaN;
  let s = String(text).replace(/\s/g, '');
  if (s === '') return null;

  let negative = false;
  const bracket = /^\((.*)\)$/.exec(s);
  if (bracket) {
    negative = true;
    s = bracket[1];
  }

  const { decimalSep, thousandsSep } = spec;
  if (s.includes(decimalSep)) {
    const at = s.lastIndexOf(decimalSep);
    const intPart = thousandsSep ? s.slice(0, at).split(thousandsSep).join('') : s.slice(0, at);
    s = `${intPart}.${s.slice(at + 1)}`;
  } else if (thousandsSep && s.includes(thousandsSep)) {
    // Sólo es separador de miles si agrupa de a 3 ("1.234.567"); si no, el
    // usuario usó el otro separador como decimal ("1234.5" con el teclado numérico).
    const grouped = new RegExp(`^[-+]?\\d{1,3}(${escapeRe(thousandsSep)}\\d{3})+$`);
    s = grouped.test(s) ? s.split(thousandsSep).join('') : s.replace(thousandsSep, '.');
  }

  if (!PLAIN_NUMBER_RE.test(s)) return Number.NaN;
  const n = Number(s);
  return negative ? -Math.abs(n) : n;
}

/**
 * Valor del modelo (número o string del backend) → número. El backend manda
 * punto decimal sin miles (`'1234.50'`); si no, se interpreta como texto con el spec.
 * @param {unknown} value
 * @param {NumericSpec} spec
 * @returns {number|null} `null` si está vacío, `NaN` si no es número.
 */
export function valueToNumber(value, spec) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN;
  const s = String(value).trim();
  if (s === '') return null;
  if (PLAIN_NUMBER_RE.test(s)) return Number(s);
  return parseNumber(s, spec);
}

/**
 * Número → texto de display con separadores y decimales fijos.
 * `null`/`''` → `''`; un valor que no es número se devuelve tal cual.
 * @param {unknown} value número o string del backend.
 * @param {NumericSpec} spec
 * @param {{ grouping?: boolean }} [options] `grouping: false` omite los miles (texto de edición).
 * @returns {string}
 */
export function formatNumber(value, spec, { grouping = true } = {}) {
  const n = valueToNumber(value, spec);
  if (n === null) return '';
  if (Number.isNaN(n)) return String(value);

  const fixed = Math.abs(n).toFixed(spec.decimals);
  const [intPart, fracPart] = fixed.split('.');
  const groupedInt =
    grouping && spec.thousandsSep ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, spec.thousandsSep) : intPart;
  const body = fracPart ? `${groupedInt}${spec.decimalSep}${fracPart}` : groupedInt;

  if (n >= 0 || Number(fixed) === 0) return body;
  return spec.negativeBrackets ? `(${body})` : `-${body}`;
}

/**
 * Texto tipeado → valor que viaja al backend: string con punto decimal y sin
 * miles (`'1234.5'`), igual al que Histrix devuelve en las filas. Vacío → `''`
 * (no se convierte a 0); texto inválido se deja tal cual para que la validación lo marque.
 * @param {string|number|null|undefined} text
 * @param {NumericSpec} spec
 * @returns {string}
 */
export function toBackendNumber(text, spec) {
  const n = parseNumber(text, spec);
  if (n === null) return '';
  if (Number.isNaN(n)) return String(text);
  return String(n);
}

/**
 * Error de validación de un valor del modelo, o `null` si es válido. Vacío es
 * válido (lo decide `required`).
 * @param {unknown} value
 * @param {NumericSpec} spec
 * @returns {null|'numeric'|'integer'|'decimals'|'min'|'max'}
 */
export function numberError(value, spec) {
  const n = valueToNumber(value, spec);
  if (n === null) return null;
  if (Number.isNaN(n)) return 'numeric';
  if (spec.integer && !Number.isInteger(n)) return 'integer';
  if (!spec.integer && Number(n.toFixed(spec.decimals)) !== n) return 'decimals';
  if (spec.min !== null && n < spec.min) return 'min';
  if (spec.max !== null && n > spec.max) return 'max';
  return null;
}

function toInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) || n < 0 ? null : n;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isTruthyAttr(value) {
  if (value === null || value === undefined || value === false) return false;
  const s = String(value).trim().toLowerCase();
  return s !== '' && s !== 'false' && s !== '0';
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
