import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthAdapter } from './auth.js';
import config from './config.js';
import { createHistrixClient, withApiErrors } from './histrixApi.js';
import { createMemoryStorage } from './storage.js';

function fakeHttp(data = {}) {
  const http = vi.fn(() => Promise.resolve({ data }));
  for (const m of ['get', 'post', 'put', 'delete']) http[m] = vi.fn(() => Promise.resolve({ data }));
  return http;
}

afterEach(() => {
  config.fixApi = '';
  config.apiUrl = '';
  config.db = '';
});

describe('createHistrixClient', () => {
  it('arma apiUrl con host y db explícitos', () => {
    const client = createHistrixClient({
      http: fakeHttp(),
      host: 'https://erp.com',
      db: 'demo',
      storage: createMemoryStorage()
    });
    expect(client.apiUrl()).toBe('https://erp.com/api/db/demo');
  });

  it('sin opciones lee del storage y de config (apiUrl canónico)', () => {
    config.apiUrl = 'https://erp.com/api/db/x';
    const storage = createMemoryStorage({ database: 'demo' });
    const client = createHistrixClient({ http: fakeHttp(), storage });
    expect(client.host()).toBe('https://erp.com');
    expect(client.apiUrl()).toBe('https://erp.com/api/db/demo');
  });

  it('fixApi sigue funcionando con un warning de deprecado', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    config.fixApi = 'https://viejo.com';
    config.db = 'd';
    const client = createHistrixClient({ http: fakeHttp(), storage: createMemoryStorage() });
    expect(client.apiUrl()).toBe('https://viejo.com/api/db/d');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fixApi'));
    warn.mockRestore();
  });

  it('login pasa por el adaptador de auth y guarda el usuario', async () => {
    const http = fakeHttp({ id: 3, verified: 1 });
    const storage = createMemoryStorage();
    const setUser = vi.fn();
    const login = vi.fn(() => Promise.resolve());
    const auth = createAuthAdapter({ login, setUser });
    const client = createHistrixClient({ http, host: 'https://erp.com', db: 'demo', auth, storage });
    await client.login('u', 'p', '/home');
    const args = login.mock.calls[0][0];
    expect(args).toMatchObject({ username: 'u', password: 'p', redirect: '/home' });
    expect(args.request.url).toBe('https://erp.com/api/db/demo/token');
    expect(args.request.data).toMatchObject({ username: 'u', password: 'p', grant_type: 'password' });
    expect(setUser).toHaveBeenCalledWith({ id: 3, verified: 1 });
    expect(JSON.parse(storage.get('user'))).toEqual({ id: 3, verified: 1 });
  });

  it('logout borra el usuario guardado; getToken cae al storage', () => {
    const logout = vi.fn();
    const storage = createMemoryStorage({ user: '{}', accessToken: 'abc' });
    const client = createHistrixClient({ http: fakeHttp(), auth: createAuthAdapter({ logout }), storage });
    expect(client.getToken()).toBe('abc');
    client.logout();
    expect(logout).toHaveBeenCalled();
    expect(storage.get('user')).toBeNull();
  });
});

describe('withApiErrors', () => {
  it('sin cliente http rechaza con un HistrixApiError legible', async () => {
    const http = withApiErrors(() => undefined);
    await expect(http.get('/x')).rejects.toMatchObject({ message: expect.stringContaining('no hay cliente http') });
  });

  it('acepta la instancia directa', async () => {
    const instance = fakeHttp({ ok: true });
    const http = withApiErrors(instance);
    await expect(http.get('/x')).resolves.toEqual({ data: { ok: true } });
    expect(instance.get).toHaveBeenCalledWith('/x');
  });
});
