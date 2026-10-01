// Textos de la librería, inyectables. Sin dependencias: una app con vue-i18n
// puede pasar `{ t: i18n.global.t }` y la lib usa ese `t` con la misma firma.
//
// Interfaz: { locale: Ref<string>, t(key, params?) → string }
// Las claves son planas con namespace por componente ('table.perPage').
// Fallback: messages[locale][key] → es[key] → la clave misma.
// Los textos que manda el backend (labels, títulos, processButton) no pasan por acá.
import { getCurrentInstance, inject, isRef, ref } from 'vue';
import en from '../locales/en.js';
import es from '../locales/es.js';

export const HISTRIX_I18N_KEY = Symbol('histrixI18n');

export const defaultMessages = { es, en };

const interpolate = (text, params) => {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] == null ? match : String(params[name])));
};

/**
 * @param {{ locale?: string | import('vue').Ref<string>, messages?: Record<string, Record<string, string>> }} options
 * `messages` se mezcla por locale con los diccionarios de la lib: alcanza con pasar las claves a pisar.
 */
export function createHistrixI18n({ locale = 'es', messages = {} } = {}) {
  const current = isRef(locale) ? locale : ref(locale || 'es');
  const dictionaries = { ...defaultMessages };
  for (const [lang, dict] of Object.entries(messages || {})) {
    dictionaries[lang] = { ...(dictionaries[lang] || {}), ...dict };
  }
  const t = (key, params) => {
    const text = dictionaries[current.value]?.[key] ?? dictionaries.es[key] ?? key;
    return interpolate(text, params);
  };
  return { locale: current, messages: dictionaries, t };
}

// Una implementación externa (vue-i18n) trae su propio `t`; la clave inexistente
// cae al diccionario es de la lib para que nunca se vea la clave cruda.
function adaptI18n(impl) {
  if (impl && typeof impl.t === 'function' && !impl.messages) {
    const fallback = createHistrixI18n();
    return {
      locale: isRef(impl.locale) ? impl.locale : fallback.locale,
      messages: fallback.messages,
      t: (key, params) => {
        const text = impl.t(key, params);
        return text == null || text === key ? fallback.t(key, params) : text;
      }
    };
  }
  if (impl && typeof impl.t === 'function') return impl;
  return createHistrixI18n(impl || {});
}

let defaultI18n = createHistrixI18n();

/** `impl`: opciones de createHistrixI18n, una instancia ya creada o un objeto con `t`. */
export function provideHistrixI18n(app, impl) {
  const i18n = adaptI18n(impl);
  defaultI18n = i18n;
  app.provide(HISTRIX_I18N_KEY, i18n);
  return i18n;
}

// Fuera de setup (o sin plugin instalado) devuelve el último registrado.
export function useHistrixI18n() {
  if (!getCurrentInstance()) return defaultI18n;
  return inject(HISTRIX_I18N_KEY, null) || defaultI18n;
}
