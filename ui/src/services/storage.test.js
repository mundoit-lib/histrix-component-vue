import { afterEach, describe, expect, it } from 'vitest';
import config from './config.js';
import { createBrowserStorage, createMemoryStorage, readJson, useHistrixStorage } from './storage.js';

afterEach(() => {
  config.storage = undefined;
});

describe('createMemoryStorage', () => {
  it('get/set/remove con valores string', () => {
    const storage = createMemoryStorage({ host: 'https://a.com' });
    expect(storage.get('host')).toBe('https://a.com');
    storage.set('n', 5);
    expect(storage.get('n')).toBe('5');
    storage.remove('n');
    expect(storage.get('n')).toBeNull();
  });
});

describe('createBrowserStorage', () => {
  it('sin localStorage (node) cae a memoria', () => {
    const storage = createBrowserStorage();
    storage.set('database', 'demo');
    expect(storage.get('database')).toBe('demo');
  });
});

describe('useHistrixStorage', () => {
  it('config.storage = false no persiste nada entre claves de otros', () => {
    config.storage = false;
    const storage = useHistrixStorage();
    storage.set('x', '1');
    expect(useHistrixStorage().get('x')).toBe('1');
    expect(typeof storage.remove).toBe('function');
  });

  it('usa el adaptador de la config y completa remove', () => {
    const data = {};
    config.storage = {
      get: (k) => data[k],
      set: (k, v) => {
        data[k] = v;
      }
    };
    const storage = useHistrixStorage();
    storage.set('host', 'h');
    expect(storage.get('host')).toBe('h');
    storage.remove('host');
    expect(storage.get('host')).toBeNull();
    expect(storage.get('nada')).toBeNull();
  });
});

describe('readJson', () => {
  it('parsea, y devuelve null si falta o está corrupto', () => {
    const storage = createMemoryStorage({ user: '{"id":1}', roto: '{', vacio: '' });
    expect(readJson(storage, 'user')).toEqual({ id: 1 });
    expect(readJson(storage, 'roto')).toBeNull();
    expect(readJson(storage, 'vacio')).toBeNull();
    expect(readJson(storage, 'falta')).toBeNull();
  });
});
