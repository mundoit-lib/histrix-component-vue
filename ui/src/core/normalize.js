/**
 * Normalización pura de los tipos que llegan en el schema de Histrix.
 *
 * El backend no compara strings exactos:
 *   - `schema.type` es el atributo `tipo` del XML tal cual está escrito, y la
 *     vista se elige con `ucfirst(str_replace('-', '', tipo))` sobre nombres de
 *     clase PHP (case-insensitive). `liveGrid`, `livegrid` y `live-grid` son la
 *     misma pantalla.
 *   - `histrix_type` es el nombre corto de la clase PHP del campo, en
 *     PascalCase (`Decimal`, `Email`, `CustomNumeric`…); `Field` si el tipo es
 *     desconocido.
 *
 * Estas funciones llevan ambos a una clave canónica (minúsculas, sin guiones)
 * antes de cualquier comparación en el cliente.
 */

/**
 * Sinónimos y typos de `schema.type` presentes en XML reales.
 * Las claves ya están en minúsculas y sin guiones.
 * @type {Record<string, string>}
 */
export const SCREEN_TYPE_SYNONYMS = {
  consula: 'consulta',
  dalete: 'delete',
  cards: 'card'
};

/**
 * Sinónimos de `histrix_type` (clases PHP que se comportan igual en el cliente).
 * Las claves ya están en minúsculas y sin guiones ni guiones bajos.
 * @type {Record<string, string>}
 */
export const FIELD_TYPE_SYNONYMS = {
  hfloat: 'decimal',
  customnumeric: 'decimal',
  enclosednumeric: 'decimal',
  enclosedinteger: 'decimal',
  int: 'integer',
  simpleditor: 'editor',
  hora: 'time',
  char: 'varchar',
  character: 'varchar',
  field: 'text',
  htmlfield: 'html'
};

/**
 * Clave canónica de un `schema.type`: minúsculas, sin guiones y con los
 * sinónimos/typos conocidos resueltos. `''` si no hay tipo.
 * @param {unknown} type
 * @returns {string}
 */
export function normalizeScreenType(type) {
  if (typeof type !== 'string') return '';
  const key = type.trim().toLowerCase().replace(/-/g, '');
  return SCREEN_TYPE_SYNONYMS[key] ?? key;
}

/**
 * Clave canónica de un `histrix_type`: minúsculas, sin guiones ni guiones
 * bajos y con los sinónimos resueltos. `''` si no hay tipo.
 * @param {unknown} histrixType
 * @returns {string}
 */
export function normalizeFieldType(histrixType) {
  if (typeof histrixType !== 'string') return '';
  const key = histrixType.trim().toLowerCase().replace(/[-_]/g, '');
  return FIELD_TYPE_SYNONYMS[key] ?? key;
}
