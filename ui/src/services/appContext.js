// Acceso a la app Vue que usa la librería, sin importar plugins. Los adaptadores
// por defecto (bus, auth, http, router) se resuelven por `globalProperties`, que
// es donde los dejan plugin-vue-event ($events), plugin-vue-auth ($auth),
// plugin-vue-axios ($axios) y vue-router ($router).
import { getCurrentInstance } from 'vue';

let installedApp = null;

/** Lo llama `HistrixPlugin.install`: permite resolver adaptadores fuera de setup. */
export function setHistrixApp(app) {
  installedApp = app || null;
}

/** App activa: la del componente en curso o, fuera de setup, la del plugin. */
export function getHistrixApp() {
  return getCurrentInstance()?.appContext?.app || installedApp;
}

/** Lee `app.config.globalProperties[name]` de la app activa. */
export function globalProperty(name) {
  const app = getHistrixApp();
  return app?.config?.globalProperties?.[name];
}
