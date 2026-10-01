const valueConfig = {
  db: process.env.DB ? process.env.DB : '',
  baseUrl: process.env.BASE_URL ? process.env.BASE_URL : '',
  mainUrl: process.env.MAIN_URL ? process.env.MAIN_URL : '',
  apiUrl: process.env.API_URL ? process.env.API_URL : '',
  clientId: process.env.CLIENT_ID ? process.env.CLIENT_ID : '',
  clientSecret: process.env.CLIENT_SECRET ? process.env.CLIENT_SECRET : '',
  // Deprecado: host del servidor. Usar `apiUrl` (host o URL completa de la base).
  fixApi: process.env.FIX_API_URL ? process.env.FIX_API_URL : '',
  // Cliente http (tipo axios). Sin definir: el `$axios` de plugin-vue-axios. `axios` es el nombre viejo.
  http: undefined,
  axios: undefined,
  // Adaptador de auth (ver services/auth.js). Sin definir: el `$auth` de la app.
  auth: undefined,
  // Persistencia { get, set, remove } (ver services/storage.js). Sin definir: localStorage; false: nada.
  storage: undefined,
  // Navegación (to, { replace, back }) => void. Sin definir: el `$router` de la app.
  onNavigate: undefined,
  // Callback opcional ante un 401 (sesión expirada). Recibe el HistrixApiError.
  onUnauthorized: undefined
};

export const config = new Proxy(valueConfig, {
  get: (target, prop, _receiver) => {
    return target[prop];
  },
  set: (target, props, newVal, _receiver) => {
    target[props] = newVal;
    return true;
  }
});

export default config;
