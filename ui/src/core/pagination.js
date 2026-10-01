/**
 * pagination.js — lógica pura de la paginación server-side de HistrixTable.
 *
 * La tabla pide `GET /app/{xml}?_dt=table`, que devuelve las filas en formato
 * DataTables (`{data, recordsTotal, ...}`, con DT_RowAttr y celdas-objeto). En
 * ese modo el backend NO aplica `page/page_size` (PaginationRequest sólo corre
 * sin `_dt`), pero sí respeta el legacy `_limit=offset,count`. Por eso se mandan
 * los dos: `_limit` es el que pagina hoy y `page/page_size/with_total` quedan
 * listos para cuando el backend los tome también en `_dt` (mismos valores).
 *
 * Sin `_dt` y con límite el backend devuelve otro envoltorio:
 * `{data, pagination: {limit, offset, count, has_more, total?}}`. parsePageResponse
 * entiende los dos.
 */

/**
 * Arma los query params de una página.
 *
 * @param {Object} pagination - estado de la q-table ({page, rowsPerPage, sortBy, descending}).
 * @param {Object} [config] - paginationConfig del schema ({maxLimit}).
 * @returns {Object} params para el GET. `rowsPerPage` 0 ("Todos") no limita.
 */
export function buildPageParams(pagination, config = {}) {
  const { page = 1, rowsPerPage = 0, sortBy, descending } = pagination || {};
  const params = {
    _sortBy: sortBy ? `${sortBy}|${descending ? 'desc' : 'asc'}` : ''
  };
  let size = Number(rowsPerPage) || 0;
  const maxLimit = Number(config.maxLimit) || 0;
  if (maxLimit && size > maxLimit) {
    size = maxLimit;
  }
  if (size > 0) {
    const current = Math.max(1, Number(page) || 1);
    params.page = current;
    params.page_size = size;
    params.with_total = 1;
    params._limit = `${(current - 1) * size},${size}`;
  }
  return params;
}

/**
 * Normaliza la respuesta de una página.
 *
 * Con `_dt` + `_limit` el backend no corre el COUNT y `recordsTotal` es la
 * cantidad de filas traídas: si la página vino llena y el total no supera lo
 * ya visto, el total real es desconocido (`total: null`) y se asume que hay más.
 *
 * @param {Object} body - response.data del GET.
 * @param {Object} [request] - {offset, limit} pedidos (limit 0 = sin límite).
 * @returns {{rows: Array, total: (number|null), hasMore: boolean}}
 */
export function parsePageResponse(body, request = {}) {
  const rows = Array.isArray(body?.data) ? body.data : [];
  const offset = Number(request.offset) || 0;
  const limit = Number(request.limit) || 0;
  const seen = offset + rows.length;

  const envelope = body?.pagination;
  if (envelope && typeof envelope === 'object') {
    const total = envelope.total !== undefined && envelope.total !== null ? Number(envelope.total) : null;
    return { rows, total, hasMore: Boolean(envelope.has_more) };
  }

  if (body?.recordsTotal === undefined || body?.recordsTotal === null || body?.recordsTotal === '') {
    return { rows, total: limit ? null : rows.length, hasMore: limit > 0 && rows.length >= limit };
  }

  const total = Number(body.recordsTotal) || 0;
  if (total > seen) {
    return { rows, total, hasMore: true };
  }
  if (limit > 0 && rows.length >= limit) {
    return { rows, total: null, hasMore: true };
  }
  return { rows, total: seen, hasMore: false };
}
