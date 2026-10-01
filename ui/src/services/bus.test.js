import { describe, expect, it, vi } from 'vitest';
import { adaptBus, createHistrixBus, useHistrixBus } from './bus.js';

/** Bus con la forma de plugin-vue-event: emite un array y `on` devuelve el listener envuelto. */
function fakeEventsPlugin() {
  const handlers = new Map();
  return {
    fire(name, ...args) {
      for (const h of handlers.get(name) || []) h(args);
    },
    emit(name, ...args) {
      for (const h of handlers.get(name) || []) h(args);
    },
    on(name, callback) {
      const listener = (args) => callback(...args);
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(listener);
      return listener;
    },
    off(name, listener) {
      const list = handlers.get(name) || [];
      const i = list.indexOf(listener);
      if (i !== -1) list.splice(i, 1);
    },
    count: (name) => (handlers.get(name) || []).length
  };
}

describe('createHistrixBus', () => {
  it('emite a los suscriptos con todos los argumentos', () => {
    const bus = createHistrixBus();
    const handler = vi.fn();
    bus.on('login-ok', handler);
    bus.emit('login-ok', 1, 'a');
    expect(handler).toHaveBeenCalledWith(1, 'a');
  });

  it('on devuelve unsubscribe y off también desuscribe', () => {
    const bus = createHistrixBus();
    const a = vi.fn();
    const b = vi.fn();
    const stop = bus.on('x', a);
    bus.on('x', b);
    stop();
    bus.off('x', b);
    bus.emit('x');
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('un handler que falla no corta a los demás', () => {
    const bus = createHistrixBus();
    const ok = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    bus.on('x', () => {
      throw new Error('boom');
    });
    bus.on('x', ok);
    bus.emit('x');
    expect(ok).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('adaptBus (plugin-vue-event)', () => {
  it('usa fire y desempaqueta los argumentos', () => {
    const events = fakeEventsPlugin();
    const bus = adaptBus(events);
    const handler = vi.fn();
    bus.on('loaded-user', handler);
    bus.emit('loaded-user', { id: 1 }, 2);
    expect(handler).toHaveBeenCalledWith({ id: 1 }, 2);
  });

  it('off/unsubscribe le pasan al plugin el listener envuelto', () => {
    const events = fakeEventsPlugin();
    const bus = adaptBus(events);
    const handler = vi.fn();
    const stop = bus.on('a', handler);
    expect(events.count('a')).toBe(1);
    stop();
    expect(events.count('a')).toBe(0);
    bus.on('b', handler);
    bus.off('b', handler);
    expect(events.count('b')).toBe(0);
  });

  it('cachea el adaptador por bus (on y off desde llamadas distintas)', () => {
    const events = fakeEventsPlugin();
    expect(adaptBus(events)).toBe(adaptBus(events));
  });
});

describe('useHistrixBus', () => {
  it('fuera de setup y sin plugin cae al bus interno', () => {
    const bus = useHistrixBus();
    const handler = vi.fn();
    const stop = bus.on('interno', handler);
    useHistrixBus().emit('interno', 'ok');
    stop();
    expect(handler).toHaveBeenCalledWith('ok');
  });
});
