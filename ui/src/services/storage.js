// Persistencia inyectable: { get(key) → string|null, set(key, value), remove(key) }.
//
// `config.storage` decide de dónde lee la librería host, base, usuario y
// preferencias de UI:
//   - sin definir → localStorage (compat con las apps actuales);
//   - false       → nada se persiste (memoria del proceso);
//   - un objeto con la interfaz → ese.
// Este es el único archivo de la librería que toca `localStorage`.
import config from './config.js';

export function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get: (key) => (data.has(key) ? data.get(key) : null),
    set: (key, value) => {
      data.set(key, value == null ? value : String(value));
    },
    remove: (key) => {
      data.delete(key);
    }
  };
}

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const hasLocalStorage = () => safe(() => typeof localStorage !== 'undefined' && localStorage !== null, false);

/** Adaptador sobre `window.localStorage`; si no existe (SSR, tests) cae a memoria. */
export function createBrowserStorage() {
  const memory = createMemoryStorage();
  return {
    get: (key) => (hasLocalStorage() ? safe(() => localStorage.getItem(key)) : memory.get(key)),
    set: (key, value) => {
      if (hasLocalStorage()) safe(() => localStorage.setItem(key, value));
      else memory.set(key, value);
    },
    remove: (key) => {
      if (hasLocalStorage()) safe(() => localStorage.removeItem(key));
      else memory.remove(key);
    }
  };
}

const browserStorage = createBrowserStorage();
const disabledStorage = createMemoryStorage();

/** Storage resuelto según `config.storage`. */
export function useHistrixStorage() {
  const custom = config.storage;
  if (custom === false) return disabledStorage;
  if (custom && typeof custom.get === 'function' && typeof custom.set === 'function') {
    return {
      get: (key) => custom.get(key) ?? null,
      set: (key, value) => custom.set(key, value),
      remove: (key) => (typeof custom.remove === 'function' ? custom.remove(key) : custom.set(key, null))
    };
  }
  return browserStorage;
}

/** Lee un JSON guardado; `null` si no hay o está corrupto. */
export function readJson(storage, key) {
  const raw = storage.get(key);
  if (raw == null || raw === '') return null;
  return safe(() => JSON.parse(raw));
}
