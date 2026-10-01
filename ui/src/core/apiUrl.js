// Cálculo de host y URL base de la API de Histrix, sin estado.
//
// `apiUrl` es la clave canónica de la config: puede ser el host pelado
// (`https://erp.ejemplo.com`) o la URL completa de una base
// (`https://erp.ejemplo.com/api/db/demo`); de ahí se deriva el host.
// `fixApi` es el nombre viejo del host: se sigue respetando (las apps actuales
// lo setean por FIX_API_URL) pero está deprecado.

const trimSlash = (value) => String(value || '').replace(/\/+$/, '');

/** Host a partir de una URL de API: corta desde `/api/` (o devuelve la URL tal cual). */
export function hostFromApiUrl(apiUrl) {
  const url = trimSlash(apiUrl);
  if (!url) return '';
  const index = url.indexOf('/api/');
  if (index !== -1) return url.slice(0, index);
  return url.endsWith('/api') ? url.slice(0, -4) : url;
}

/**
 * Host efectivo. Orden: el guardado (selector de conexión) → `fixApi` (deprecado,
 * compat) → derivado de `apiUrl`.
 */
export function resolveHost({ storedHost, fixApi, apiUrl } = {}) {
  if (storedHost) return trimSlash(storedHost);
  if (fixApi) return trimSlash(fixApi);
  return hostFromApiUrl(apiUrl);
}

/** URL base de la API de una base: `${host}/api/db/${db}`, o `apiUrl` si no hay base. */
export function buildApiUrl({ host, db, apiUrl } = {}) {
  if (db) return `${trimSlash(host)}/api/db/${db}`;
  return trimSlash(apiUrl);
}
