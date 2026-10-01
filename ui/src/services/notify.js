// Notificaciones inyectables. Este archivo NO importa Quasar: la implementación
// por defecto vive en `notify.quasar.js` y la registra el plugin. Una app puede
// inyectar la suya con `app.use(HistrixPlugin, { notify })` o
// `provideHistrixNotify(app, impl)`.
//
// Interfaz: { success(msg), error(msg | HistrixApiError), info(msg), confirm(msg) → Promise<boolean> }
import { inject } from 'vue';

export const HISTRIX_NOTIFY_KEY = Symbol('histrixNotify');

const toMessage = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value.message || String(value);
};

const fallbackImpl = {
  success: (msg) => console.info(msg),
  error: (msg) => console.error(msg),
  info: (msg) => console.info(msg),
  confirm: (msg) =>
    Promise.resolve(typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(msg) : false)
};

/**
 * Arma un notifier completo a partir de una implementación parcial. Los métodos
 * reciben siempre un string (los HistrixApiError se pasan por su `.message`);
 * `error` recibe además el error original como segundo argumento.
 */
export function createNotifier(impl = {}) {
  const pick = (name) => (typeof impl[name] === 'function' ? impl[name] : fallbackImpl[name]);
  return {
    success: (msg) => pick('success')(toMessage(msg)),
    info: (msg) => pick('info')(toMessage(msg)),
    error: (err) => pick('error')(toMessage(err), err),
    confirm: (msg) => Promise.resolve(pick('confirm')(toMessage(msg))).then(Boolean)
  };
}

let defaultNotifier = createNotifier();

export function provideHistrixNotify(app, impl) {
  const notifier = createNotifier(impl);
  defaultNotifier = notifier;
  app.provide(HISTRIX_NOTIFY_KEY, notifier);
  return notifier;
}

// Fuera de setup (o sin plugin instalado) devuelve el último registrado.
export function useHistrixNotify() {
  return inject(HISTRIX_NOTIFY_KEY, null) || defaultNotifier;
}
