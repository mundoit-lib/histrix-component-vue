/**
 * Vuelca las variables de entorno (import.meta.env.VITE_*) a la config runtime
 * de la librería @mundoit-lib/histrix-component-vue.
 *
 * `services/config.js` de la librería lee de `process.env.*` en build-time, pero
 * en el browser con Vite eso queda vacío (ver `define: { 'process.env': {} }` en
 * vite.config.js). En vez de tocar config.js (las apps webpack dependen de él),
 * acá seteamos los valores en runtime sobre el Proxy `config`.
 *
 * Recordar (de histrixApi.js):
 *   host()      = localStorage.host     || config.fixApi
 *   currentDb() = localStorage.database || config.db
 *   apiUrl()    = `${host()}/api/db/${currentDb()}`
 */
import config from '@mundoit-lib/histrix-component-vue/services/config';

const env = import.meta.env;

const host = (env.VITE_HISTRIX_HOST || '').replace(/\/$/, '');
const db = env.VITE_HISTRIX_DB || '';
const mainUrl = env.VITE_HISTRIX_MAIN_URL || (host ? `${host}/api/db/` : '');

// Host efectivo (host() usa fixApi) y fallback apiUrl.
config.fixApi = host;
config.baseUrl = host;
config.apiUrl = host;
config.mainUrl = mainUrl;

// Base/cliente por defecto.
config.db = db;

// OAuth2.
config.clientId = env.VITE_CLIENT_ID || '';
config.clientSecret = env.VITE_CLIENT_SECRET || '';

// Igual que el boot de axios de las apps reales (angel-alvarez-frontend):
// pre-setear host/database en localStorage, que es de donde los leen
// histrixApi (host()/currentDb()) y DatabaseSelector.
if (typeof localStorage !== 'undefined' && host) {
  localStorage.setItem('host', host);
  localStorage.setItem('database', db);
}

if (!host) {
  // eslint-disable-next-line no-console
  console.warn('[playground] VITE_HISTRIX_HOST está vacío. Copiá .env.example a .env y completá los valores.');
}

export default config;
