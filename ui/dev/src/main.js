// IMPORTANTE: setup.js debe importarse PRIMERO. Vuelca import.meta.env.VITE_* a
// la config de la librería antes de que cualquier componente (que importa
// `services/config`) se evalúe.
import './setup.js';

// UnoCSS (utility classes estilo Tailwind, como en todas las apps de Mundo IT).
import 'virtual:uno.css';

import { createApp } from 'vue';

// Quasar
import { Dialog, Loading, Notify, Quasar } from 'quasar';
import quasarIconSet from 'quasar/icon-set/material-icons';
import quasarLang from 'quasar/lang/es';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';

// Plugins @mundoit-lib — mismo patrón que los boot files de las apps reales
// (referencia: angel-alvarez-frontend/src/boot/{axios,auth,events}.js).
import { install as authPlugin } from '@mundoit-lib/plugin-vue-auth';
import { axiosInstance, install as axiosPlugin } from '@mundoit-lib/plugin-vue-axios';
// v1.0.2+ exporta named `eventsPlugin` (la 1.0.0 de las apps viejas tenía default export).
import { eventsPlugin } from '@mundoit-lib/plugin-vue-event';

// Plugin de la librería: registra TODOS los componentes globalmente.
// El subpath /plugin valida el export "./plugin" del package.
import HistrixPlugin from '@mundoit-lib/histrix-component-vue/plugin';

import App from './App.vue';
import router from './router.js';
import config from './setup.js';

const app = createApp(App);

app.use(Quasar, {
  plugins: { Notify, Dialog, Loading },
  lang: quasarLang,
  iconSet: quasarIconSet
});

// 1) Axios — mapeo idéntico al boot/axios.js de referencia:
//    baseURL = host pelado (FIX_API_URL), fixURL = URL completa /api/db/{db}.
app.use(axiosPlugin, {
  baseURL: config.fixApi || '',
  db: config.db || '',
  clientID: config.clientId || '',
  clientSecret: config.clientSecret || '',
  fixURL: `${config.fixApi || ''}/api/db/${config.db || ''}`
});
app.config.globalProperties.$axios = axiosInstance;
app.config.globalProperties.$api = axiosInstance;

// 2) Auth — forma exacta del boot/auth.js de referencia. El plugin trae
//    defaults correctos para Histrix (tokenDefaultKey 'accessToken',
//    rememberkey 'refreshToken', driver que extrae res.data.access_token),
//    así que no hace falta pasar drivers ni options.
app.use(authPlugin, {
  plugins: {
    http: axiosInstance,
    router: router
  }
});

// 3) Eventos — $events.fire/on/off + option `events:` en componentes.
//    La librería lo usa (login-ok, loaded-user, closepopup, update-favorit...).
app.use(eventsPlugin);

// 4) Router + guard de auth (patrón boot/router.js de referencia, simplificado:
//    acá no hay denyRoles). Las rutas con meta.public no requieren login.
app.use(router);
const auth = app.config.globalProperties.$auth;
router.beforeEach((to) => {
  if (to.meta.public || to.name === 'home') return true;
  const logged = (auth && typeof auth.check === 'function' && auth.check()) || !!localStorage.getItem('accessToken');
  if (!logged) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  return true;
});

// 5) Componentes de la librería (registro global vía install()).
app.use(HistrixPlugin);

app.mount('#app');
