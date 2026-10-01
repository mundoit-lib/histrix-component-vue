// Normalización de las respuestas de datos (`GET /app/{xml}`). Puro.
// El backend devuelve 204 sin body cuando la consulta no tiene resultados y
// usa tres envoltorios: `{data}`, `{data, pagination}` y el de DataTables
// `{data, recordsTotal, recordsFiltered, paging}`.

/**
 * @param {{ status?: number, data?: any }} response respuesta de axios
 * @returns {{ data: any[], pagination?: object, recordsTotal?: number }}
 *   El resto de las claves del body se conservan (p. ej. `recordsFiltered`).
 */
export function normalizeData(response) {
  const body = response?.data;
  if (response?.status === 204 || body == null || body === '') {
    return { data: [] };
  }
  if (Array.isArray(body)) {
    return { data: body };
  }
  if (typeof body !== 'object') {
    return { data: [] };
  }
  const result = { ...body };
  // Sólo se completa cuando falta: un `data` no-array se deja como vino para
  // no romper call-sites que lo consumen así.
  if (result.data == null) {
    result.data = [];
  }
  if (result.recordsTotal != null) {
    result.recordsTotal = Number(result.recordsTotal);
  }
  return result;
}
