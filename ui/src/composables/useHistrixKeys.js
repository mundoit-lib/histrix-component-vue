/**
 * useHistrixKeys — atajos de teclado a nivel documento para HistrixApp.
 *
 * Un único listener de `keydown` en `document` para todas las apps montadas.
 * Cada HistrixApp registra su scope (elemento raíz + handler) y en cada tecla
 * despacha sólo el scope más interno que contiene al foco (core/hotkeys.js
 * `pickScope`). La decisión de qué tecla es qué acción vive en
 * `resolveAction`, que es pura y tiene tests.
 */
import { onBeforeUnmount, onMounted } from 'vue';

import { pickScope, resolveAction } from '../core/hotkeys.js';

/** @type {Array<{ el: any, enabled: () => boolean, handle: (action: string, event: KeyboardEvent) => boolean }>} */
const scopes = [];

/**
 * Proxy de los scopes con `el` resuelto al momento del evento (el root de un
 * componente Options API recién existe después del mount).
 */
function liveScopes() {
  return scopes.map((s) => ({ scope: s, el: s.el() }));
}

function onKeydown(event) {
  const picked = pickScope(liveScopes(), event.target);
  if (!picked) {
    return;
  }
  const { scope } = picked;
  const action = resolveAction(event, { enabled: scope.enabled() });
  if (!action) {
    return;
  }
  // El handler devuelve true si consumió la tecla: recién ahí se cancela el
  // comportamiento del navegador (F2/F4/F9 sueltos, submit implícito, etc.).
  if (scope.handle(action, event) === true) {
    event.preventDefault();
  }
}

/**
 * Registra un scope de atajos mientras el componente esté montado.
 *
 * @param {{ el: () => any, enabled: () => boolean, handle: (action: string, event: KeyboardEvent) => boolean }} scope
 *   - el: devuelve el elemento raíz del scope.
 *   - enabled: false apaga los atajos (prop `keyboard: false`).
 *   - handle: ejecuta la acción ('process' | 'close' | 'help' | 'clear' | 'nextField').
 */
export function useHistrixKeys(scope) {
  onMounted(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (!scopes.length) {
      document.addEventListener('keydown', onKeydown);
    }
    scopes.push(scope);
  });
  onBeforeUnmount(() => {
    const idx = scopes.indexOf(scope);
    if (idx !== -1) {
      scopes.splice(idx, 1);
    }
    if (!scopes.length && typeof document !== 'undefined') {
      document.removeEventListener('keydown', onKeydown);
    }
  });
}
