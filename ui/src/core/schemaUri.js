/**
 * @file Parseo puro de las `uri` del schema de Histrix a `{ path, params }`.
 *
 * Histrix describe recursos internos con un string `uri` con este formato:
 *   "<xml>&dir=<dir>&<param>=<valor>&..."
 * Ejemplos reales:
 *   innerContainer.uri: "xml1264548887&dir=/stock_obra/ing&"
 *   helpContainer.uri:  "ot_combinado_param_qry.xml&dir=/ayudas&"
 *   helpContainer.dataUri:
 *     "pry_req_ots_oth_ing.xml&dir=/stock_obra/ing&__help=oto_numerador_format"
 *
 * El primer segmento (sin `=`) es el nombre del XML; `dir` arma el directorio; el
 * resto son parámetros de query. El path resultante es `${dir}/${xml}` — con la
 * barra inicial que trae `dir` (el backend tolera/espera el `app//dir/...`).
 */

/**
 * Convierte una `uri` del schema en la ruta y los params para una request.
 *
 * @param {string} uri La `uri`/`dataUri` del schema.
 * @returns {{ path: string, params: Object<string,string> }}
 */
export function parseSchemaUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return { path: '', params: {} };
  }
  const segments = uri
    .split('&')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (segments.length === 0) {
    return { path: '', params: {} };
  }

  let xml = '';
  let dir = '';
  const params = {};

  segments.forEach((segment, index) => {
    const eq = segment.indexOf('=');
    if (eq === -1) {
      // Segmento sin `=`: el primero es el nombre del XML.
      if (index === 0) {
        xml = segment;
      }
      return;
    }
    const key = segment.slice(0, eq);
    const value = segment.slice(eq + 1);
    if (key === 'dir') {
      dir = value;
    } else {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });

  return { path: joinDirXml(dir, xml), params };
}

/**
 * Une `dir` + `xml` en un path (`${dir}/${xml}`), o sólo `xml` si no hay dir.
 * La barra inicial la aporta `dir` (el backend tolera/espera el `app//dir/...`).
 *
 * @param {string} dir
 * @param {string} xml
 * @returns {string}
 */
export function joinDirXml(dir, xml) {
  if (!xml) {
    return '';
  }
  return dir ? `${dir}/${xml}` : xml;
}

/**
 * Parsea el querystring `data-helpdetail` de una fila de ayuda a un objeto plano.
 *
 * El backend indica ahí, por fila, EXACTAMENTE qué campos del form rellenar y con
 * qué nombre destino (que puede diferir del nombre de columna), p. ej.:
 *   "&oto_numerador_format=OTMOA-1&id_oto=1&nombre_cliente=RENOVA+S.A&..."
 * URLSearchParams decodifica `+`/`%XX` e ignora el segmento vacío inicial.
 *
 * @param {string} detail
 * @returns {Object<string, string>}
 */
export function parseHelpDetail(detail) {
  const out = {};
  if (!detail || typeof detail !== 'string') {
    return out;
  }
  const params = new URLSearchParams(detail);
  for (const [key, value] of params.entries()) {
    if (key) {
      out[key] = value;
    }
  }
  return out;
}
