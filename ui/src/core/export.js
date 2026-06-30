/**
 * Lógica pura de exportación de tablas Histrix (sin DOM ni axios).
 *
 * El backend expone la descarga en `GET {apiBase}/export/{formato}/{path}` y
 * acepta los mismos parámetros de filtro que el listado (querystring
 * pseudo-OData `_f[]/_o[]/_v[]`, ver core/filters.js). Este módulo concentra
 * todo lo que se puede testear sin red ni navegador: armado de parámetros,
 * del nombre de archivo y de la URL. La descarga binaria en sí (Blob + <a>)
 * vive en el servicio (histrixApi.downloadAppData), que es lo único impuro.
 *
 * Es compartido por toda la app: cualquier pantalla que exporte usa estas
 * funciones, de modo que el contrato con el backend queda en un solo lugar.
 */

/** Delimitador por defecto del CSV. */
export const DEFAULT_DELIMITER = ',';

/**
 * Formatos de exportación soportados, en el orden en que se muestran.
 * `hasDelimiter` marca los formatos que aceptan un separador configurable.
 * `icon`/`color` son de Material Icons (cargados globalmente).
 */
export const EXPORT_FORMATS = [
  { format: 'xls', name: 'Excel', caption: 'Hoja de cálculo', icon: 'table_chart', color: 'green-7' },
  { format: 'pdf', name: 'PDF', caption: 'Documento para imprimir', icon: 'picture_as_pdf', color: 'red-6' },
  {
    format: 'csv',
    name: 'CSV',
    caption: 'Valores separados por comas',
    icon: 'grid_on',
    color: 'blue-7',
    hasDelimiter: true
  },
  { format: 'xml', name: 'XML', caption: 'Archivo XML de intercambio', icon: 'code', color: 'orange-8' }
];

/** Extensión de archivo por formato (hoy 1:1, pero centralizado por si cambia). */
const EXTENSIONS = {
  xls: 'xls',
  pdf: 'pdf',
  csv: 'csv',
  xml: 'xml'
};

/**
 * @param {string} format
 * @returns {string} extensión sin punto (cae al propio formato si es desconocido)
 */
export function getFormatExtension(format) {
  return EXTENSIONS[format] || format || '';
}

/**
 * Devuelve la definición del formato (o undefined si no existe).
 * @param {string} format
 */
export function findFormat(format) {
  return EXPORT_FORMATS.find((f) => f.format === format);
}

/**
 * @param {string} format
 * @returns {boolean} true si el formato acepta delimitador (CSV)
 */
export function formatHasDelimiter(format) {
  return Boolean(findFormat(format)?.hasDelimiter);
}

/**
 * Limpia un texto para usarlo como nombre de archivo: quita los caracteres
 * inválidos en la mayoría de los sistemas de archivos (`\ / : * ? " < > |`) y
 * colapsa espacios. No agrega extensión.
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFileName(name) {
  return String(name ?? '')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Arma el nombre de archivo sugerido a partir del título y el formato.
 * Reemplaza el `\`${schema.title}.${fileFormat}\`` que estaba inline en el
 * componente, agregando saneo y un fallback cuando el título viene vacío.
 * @param {string} title
 * @param {string} format
 * @returns {string} p.ej. "Localidades.xls"
 */
export function buildExportFileName(title, format) {
  const base = sanitizeFileName(title) || 'export';
  return `${base}.${getFormatExtension(format)}`;
}

/**
 * Parsea una querystring (`_f[]=a&_o[]=eq&_v[]=1`) a un objeto de parámetros.
 * Las claves con sufijo `[]` se desnudan y sus valores se acumulan en array,
 * respetando el contrato del backend. Idéntico al viejo
 * `histrixApi.queryStringToObject` (ahora reusa esta función pura).
 * @param {string} query
 * @returns {Object<string, string[]>}
 */
export function parseQueryString(query) {
  const params = new URLSearchParams(query || '');
  const result = {};
  for (const [key, value] of params.entries()) {
    const cleanKey = key.replace(/\[\]$/, '');
    if (result[cleanKey]) {
      result[cleanKey].push(value);
    } else {
      result[cleanKey] = [value];
    }
  }
  return result;
}

/**
 * Combina los parámetros de la pantalla (`query`) con los filtros activos del
 * listado (`exportQuery`, querystring) y, para CSV, agrega el delimitador.
 *
 * Antes el delimitador del CSV se mostraba en el form pero NO viajaba en la
 * request (bug muerto): acá se incluye como `_delimiter` cuando el formato lo
 * admite y el valor no está vacío.
 *
 * @param {Object} opts
 * @param {Object} [opts.query]        parámetros base de la pantalla
 * @param {string} [opts.exportQuery]  querystring de filtros del listado
 * @param {string} [opts.format]       formato elegido (xls|pdf|csv|xml)
 * @param {string} [opts.delimiter]    delimitador para CSV
 * @returns {Object} parámetros listos para enviar como query de la descarga
 */
export function buildExportParams({ query = {}, exportQuery = '', format, delimiter = DEFAULT_DELIMITER } = {}) {
  const params = { ...query, ...parseQueryString(exportQuery) };
  if (formatHasDelimiter(format) && delimiter !== undefined && delimiter !== null && delimiter !== '') {
    params._delimiter = delimiter;
  }
  return params;
}

/**
 * Construye la URL de descarga del backend.
 * @param {string} apiBase  base de la API (p.ej. "https://host/api/db/midb")
 * @param {string} format   formato (xls|pdf|csv|xml)
 * @param {string} path     ruta del recurso (p.ej. "general/localidades_crud.xml")
 * @returns {string}
 */
export function buildExportUrl(apiBase, format, path) {
  return `${apiBase}/export/${format}/${path}`;
}
