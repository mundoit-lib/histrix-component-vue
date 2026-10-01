/**
 * hotkeys.js — lógica pura de los atajos de teclado (port de
 * `H.handleSpecialKeys` del legacy, js/histrix.js).
 *
 * Nada de esto toca el DOM real: recibe objetos con la forma de un
 * KeyboardEvent / Element (key, target, closest, contains…) para poder
 * probarlo sin navegador. El listener vive en composables/useHistrixKeys.js.
 */

/** Zonas donde el teclado es del usuario: no se intercepta ninguna tecla. */
export const IGNORE_SELECTOR = 'textarea, [contenteditable=""], [contenteditable="true"], .q-editor';

/** Tecla → acción, sin modificadores. */
const KEY_ACTIONS = {
  F9: 'process',
  Escape: 'close',
  F2: 'help',
  F4: 'clear',
  Enter: 'nextField'
};

/** Tipos de <input> donde Enter tiene su propio significado (click, toggle…). */
const ENTER_SKIP_TYPES = ['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image'];

/**
 * ¿El elemento está dentro de una zona donde no se interceptan atajos
 * (textarea, contenteditable, QEditor)?
 *
 * @param {{ closest?: (selector: string) => unknown } | null | undefined} target
 * @returns {boolean}
 */
export function isInIgnoredZone(target) {
  return Boolean(target && typeof target.closest === 'function' && target.closest(IGNORE_SELECTOR));
}

/**
 * ¿El foco está en un lugar donde se escribe texto (input, select, textarea,
 * contenteditable, QEditor)? Ahí atajos de una sola tecla como `/` no van.
 *
 * @param {any} target
 * @returns {boolean}
 */
export function isTypingTarget(target) {
  if (!target) {
    return false;
  }
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(String(target.tagName).toUpperCase())) {
    return true;
  }
  return isInIgnoredZone(target);
}

/**
 * Decide qué acción corresponde a un keydown. Devuelve null si no hay que
 * hacer nada (el navegador / Quasar siguen con el comportamiento normal).
 *
 * - `ctx.enabled === false` (prop `keyboard: false`) apaga todo.
 * - Eventos ya consumidos (`defaultPrevented`: p. ej. QSelect eligiendo una
 *   opción con Enter) o en composición IME se ignoran.
 * - Con Ctrl / Alt / Meta / Shift no hay acción (Shift+Enter, Ctrl+F4…).
 * - Dentro de textarea, contenteditable o QEditor no se intercepta nada.
 * - Enter sólo avanza desde un <input> de texto con el menú cerrado.
 *
 * @param {{ key?: string, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean, shiftKey?: boolean,
 *   isComposing?: boolean, defaultPrevented?: boolean, target?: any }} event
 * @param {{ enabled?: boolean }} [ctx]
 * @returns {'process'|'close'|'help'|'clear'|'nextField'|null}
 */
export function resolveAction(event, ctx = {}) {
  if (!event || ctx.enabled === false) {
    return null;
  }
  if (event.isComposing || event.defaultPrevented) {
    return null;
  }
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
    return null;
  }
  const action = KEY_ACTIONS[event.key];
  if (!action) {
    return null;
  }
  const target = event.target;
  if (isInIgnoredZone(target)) {
    return null;
  }
  if (action === 'nextField') {
    if (!target || String(target.tagName).toUpperCase() !== 'INPUT') {
      return null;
    }
    const type = String(target.type || 'text').toLowerCase();
    if (ENTER_SKIP_TYPES.includes(type)) {
      return null;
    }
    // QSelect con el menú desplegado: Enter elige la opción, no avanza.
    if (typeof target.getAttribute === 'function' && target.getAttribute('aria-expanded') === 'true') {
      return null;
    }
  }
  return action;
}

/**
 * De los scopes registrados (un HistrixApp cada uno), elige el que debe
 * atender el evento: el más interno que contiene al target. Si ninguno lo
 * contiene (foco en body, o en un diálogo teleportado sin app propia) toma
 * el último registrado.
 *
 * @template {{ el?: any }} T
 * @param {T[]} scopes - en orden de registro.
 * @param {any} target - event.target.
 * @returns {T | null}
 */
export function pickScope(scopes, target) {
  const live = (scopes || []).filter((s) => s?.el);
  if (!live.length) {
    return null;
  }
  const containing = target ? live.filter((s) => typeof s.el.contains === 'function' && s.el.contains(target)) : [];
  if (containing.length) {
    // El más interno: el que no contiene a ningún otro candidato.
    const inner = containing.find((s) => !containing.some((o) => o !== s && s.el.contains(o.el)));
    return inner || containing[containing.length - 1];
  }
  return live[live.length - 1];
}

/**
 * ¿El elemento es un destino válido para el foco con Enter / foco inicial?
 * Descarta deshabilitados, readonly, ocultos, tabindex="-1" y botones.
 *
 * @param {any} el
 * @returns {boolean}
 */
export function isFocusCandidate(el) {
  if (!el) {
    return false;
  }
  const tag = String(el.tagName).toUpperCase();
  if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
    return false;
  }
  if (el.disabled || el.readOnly) {
    return false;
  }
  const type = String(el.type || '').toLowerCase();
  if (tag === 'INPUT' && ['hidden', ...ENTER_SKIP_TYPES].includes(type)) {
    return false;
  }
  if (typeof el.getAttribute === 'function' && el.getAttribute('tabindex') === '-1') {
    return false;
  }
  // offsetParent es null cuando el elemento (o un ancestro) está con display:none.
  if ('offsetParent' in el && el.offsetParent === null) {
    return false;
  }
  return true;
}

/**
 * Siguiente elemento enfocable después de `current`, en orden del DOM.
 * Devuelve null si `current` es el último (o no está en la lista).
 *
 * @template T
 * @param {T[]} candidates - ya filtrados con isFocusCandidate, en orden del DOM.
 * @param {T} current
 * @returns {T | null}
 */
export function nextFocusable(candidates, current) {
  const list = candidates || [];
  const idx = list.indexOf(current);
  if (idx === -1 || idx >= list.length - 1) {
    return null;
  }
  return list[idx + 1];
}

/**
 * ¿El evento coincide con un atajo tipo 'ctrl+k', 'meta+k', '/'?
 * 'ctrl' acepta también Cmd (meta) para que el mismo atajo ande en Mac.
 *
 * @param {{ key?: string, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean, shiftKey?: boolean }} event
 * @param {string} hotkey
 * @returns {boolean}
 */
export function matchHotkey(event, hotkey) {
  if (!event || !hotkey) {
    return false;
  }
  const parts = String(hotkey)
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  const key = parts.pop();
  const wants = new Set(parts);
  if (wants.has('meta')) {
    if (!event.metaKey) {
      return false;
    }
  } else if (wants.has('ctrl')) {
    if (!event.ctrlKey && !event.metaKey) {
      return false;
    }
  } else if (event.ctrlKey || event.metaKey) {
    return false;
  }
  if (wants.has('alt') !== Boolean(event.altKey)) {
    return false;
  }
  if (wants.has('shift') !== Boolean(event.shiftKey)) {
    return false;
  }
  return String(event.key || '').toLowerCase() === key;
}
