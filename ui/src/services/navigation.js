// Navegación sin acoplarse a vue-router. La librería pide navegar con
// `navigate(to, { replace })` / `back()`; quién lo resuelve:
//   1. `onNavigate(to, { replace, back })` pasado por prop al componente;
//   2. `config.onNavigate` (o `app.use(HistrixPlugin, { onNavigate })`);
//   3. `$router` de la app, si está (compat con las apps actuales).
// Este es el único archivo de la librería que toca `$router`.
import { globalProperty } from './appContext.js';
import config from './config.js';

/**
 * Devuelve `{ navigate, back }`. `source` es el handler local o un objeto con
 * `onNavigate` (las props del componente), que se lee en cada navegación.
 * Si nadie puede navegar, `navigate`/`back` devuelven `false` y no hacen nada.
 */
export function useHistrixNavigate(source) {
  // El router se resuelve al crear el helper (dentro de setup hay instancia).
  const router = globalProperty('$router');
  const handler = () => {
    const local = typeof source === 'function' ? source : source?.onNavigate;
    return typeof local === 'function' ? local : config.onNavigate;
  };

  const navigate = (to, { replace = false } = {}) => {
    const custom = handler();
    if (typeof custom === 'function') {
      custom(to, { replace, back: false });
      return true;
    }
    if (router) {
      const result = replace ? router.replace(to) : router.push(to);
      // vue-router rechaza las navegaciones duplicadas/abortadas: no es un error de la librería.
      if (result && typeof result.catch === 'function') result.catch(() => undefined);
      return true;
    }
    return false;
  };

  const back = () => {
    const custom = handler();
    if (typeof custom === 'function') {
      custom(null, { replace: false, back: true });
      return true;
    }
    if (router) {
      router.back();
      return true;
    }
    return false;
  };

  return { navigate, back };
}
