// Bus de eventos inyectable. Interfaz mínima: { emit(name, ...args), on(name, handler) → unsubscribe, off(name, handler) }.
//
// Resolución (useHistrixBus): el que inyecte la app (`provideHistrixBus` o
// `app.use(HistrixPlugin, { bus })`) → `$events` de plugin-vue-event → bus interno.
// La librería sólo lo usa para avisarle a la app (login-ok, loaded-user,
// update-favorit...) y para escuchar login-modal/event-after; la comunicación
// entre sus propios componentes va por props/emits.
import { getCurrentInstance, inject } from 'vue';
import { globalProperty } from './appContext.js';

export const HISTRIX_BUS_KEY = Symbol('histrixBus');

/** Bus interno sin dependencias (mitt-like). */
export function createHistrixBus() {
  const handlers = new Map();
  const off = (name, handler) => {
    const list = handlers.get(name);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index !== -1) list.splice(index, 1);
  };
  return {
    emit(name, ...args) {
      for (const handler of [...(handlers.get(name) || [])]) {
        try {
          handler(...args);
        } catch (error) {
          console.error(error);
        }
      }
    },
    on(name, handler) {
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(handler);
      return () => off(name, handler);
    },
    off
  };
}

const adapted = new WeakMap();

/**
 * Adapta un bus externo a la interfaz de la librería. Acepta `fire` como alias
 * de `emit` (plugin-vue-event) y buses cuyo `on` devuelve el listener envuelto
 * que después hay que pasarle a `off` (también plugin-vue-event).
 */
export function adaptBus(bus) {
  if (!bus) return null;
  if (bus.__histrixBus) return bus;
  if (adapted.has(bus)) return adapted.get(bus);
  const wrapped = new Map();
  const emitFn = typeof bus.fire === 'function' ? bus.fire : bus.emit;
  const off = (name, handler) => {
    const key = wrapped.get(handler);
    const listener = key && key.name === name ? key.listener : handler;
    wrapped.delete(handler);
    if (typeof bus.off === 'function') bus.off(name, listener);
  };
  const adapter = {
    __histrixBus: true,
    emit: (name, ...args) => emitFn.call(bus, name, ...args),
    on(name, handler) {
      const result = bus.on(name, handler);
      if (typeof result === 'function' && result !== handler) {
        // `on` devolvió el listener envuelto (o un unsubscribe): lo guardamos para `off`.
        wrapped.set(handler, { name, listener: result });
      }
      return () => off(name, handler);
    },
    off
  };
  adapted.set(bus, adapter);
  return adapter;
}

const internalBus = adaptBus(createHistrixBus());
let providedBus = null;

export function provideHistrixBus(app, bus) {
  providedBus = adaptBus(bus);
  app.provide(HISTRIX_BUS_KEY, providedBus);
  return providedBus;
}

/** Bus resuelto: inyectado → `$events` → interno. */
export function useHistrixBus() {
  const injected = getCurrentInstance() ? inject(HISTRIX_BUS_KEY, null) : null;
  if (injected) return injected;
  if (providedBus) return providedBus;
  const events = globalProperty('$events');
  if (events && typeof events.on === 'function') return adaptBus(events);
  return internalBus;
}
