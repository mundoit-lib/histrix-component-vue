/**
 * @file Resolución pura del path destino de un `helpers.link` de Histrix.
 *
 * Un `helpers.link` describe a qué XML apunta un botón/acción:
 *   { type: 'link', xml: 'pry_req_ing.xml', dir: '/stock_obra/ing', modal: 'true', ... }
 *
 * El `dir` es OPCIONAL. Cuando falta, Histrix resuelve el XML relativo al
 * directorio del XML actual (mismo criterio que `HistrixApp.showLinkDialog`,
 * que arma `/${dirname(path)}/${file}` cuando `link.dir == null`).
 */

/**
 * Devuelve el directorio (con `/` final) de un path de XML, o '' si no hay.
 * Ej: 'stock_obra/ing/tablero.xml' -> 'stock_obra/ing/'
 * @param {string} path
 * @returns {string}
 */
export function dirname(path) {
  const match = String(path ?? '').match(/.*\//);
  return match ? match[0] : '';
}

/**
 * Resuelve el path del XML al que apunta un `helpers.link`.
 *
 * @param {object} link        El objeto `helpers.link` (con `xml` y opcional `dir`).
 * @param {string} currentPath Path del XML actual (para resolver dir faltante).
 * @returns {string} Path normalizado del XML destino, o '' si el link no es válido.
 */
export function resolveHelperLinkPath(link, currentPath = '') {
  if (!link || !link.xml) {
    return '';
  }
  let path;
  if (link.dir != null && link.dir !== '') {
    path = `${link.dir}/${link.xml}`;
  } else {
    path = `/${dirname(currentPath)}${link.xml}`;
  }
  return path.replaceAll('//', '/');
}

/**
 * Convierte los `parameters` de un `helpers.link` en un objeto de query para
 * pasarle al XML destino (el form/pantalla que abre el botón).
 *
 * Cada parámetro tiene la forma `{ source, target, operator }`, p. ej.:
 *   { "source": "3", "target": "tipo_oto", "operator": "=" }
 * que significa "abrir el destino con tipo_oto = 3". El único operador que emite
 * el backend es `=` (asignar el valor); se ignora cualquier otro por seguridad.
 *
 * @param {Array<{source:any,target:string,operator?:string}>} parameters
 * @returns {Object<string, any>} query listo para mergear (p. ej. { tipo_oto: '3' }).
 */
export function buildLinkParameters(parameters) {
  const out = {};
  if (!Array.isArray(parameters)) {
    return out;
  }
  for (const param of parameters) {
    if (!param || param.target == null || param.target === '') {
      continue;
    }
    // Sólo '=' (o sin operador) asigna el valor; otros operadores no aplican a
    // un valor inicial de campo, así que se omiten.
    if (param.operator === undefined || param.operator === '=') {
      out[param.target] = param.source;
    }
  }
  return out;
}
