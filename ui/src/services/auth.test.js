import { describe, expect, it, vi } from 'vitest';
import { adaptAuth, authServiceAdapter, createAuthAdapter, useHistrixAuth, websanovaAuthAdapter } from './auth.js';
import config from './config.js';

function fakeWebsanova() {
  let user = null;
  return {
    login: vi.fn(() => Promise.resolve({ data: { access_token: 't' } })),
    logout: vi.fn(() => {
      user = null;
    }),
    user: vi.fn((value) => {
      if (value !== undefined) user = value;
      return user;
    }),
    token: vi.fn(() => 'tok'),
    check: vi.fn(() => Boolean(user)),
    redirect: vi.fn(() => null)
  };
}

function fakeAuthService({ success = true } = {}) {
  let user = null;
  const service = {
    onUserChange: null,
    login: vi.fn(async () => {
      if (!success) return { success: false, error: new Error('401') };
      user = { id: 7 };
      service.onUserChange?.(user);
      return { success: true, data: user };
    }),
    logout: vi.fn(() => {
      user = null;
      service.onUserChange?.(null);
    }),
    user: () => user,
    token: () => 'svc-token',
    check: () => Boolean(user)
  };
  return service;
}

describe('websanovaAuthAdapter', () => {
  it('login reenvía el pedido OAuth2 armado por useApi', async () => {
    const auth = fakeWebsanova();
    const adapter = websanovaAuthAdapter(auth);
    const request = { url: '/api/db/x/token', data: { username: 'u', password: 'p', grant_type: 'password' } };
    await adapter.login({ username: 'u', password: 'p', request, redirect: '/home' });
    expect(auth.login).toHaveBeenCalledWith({
      data: request.data,
      url: request.url,
      fetchUser: false,
      redirect: '/home'
    });
  });

  it('setUser usa el setter auth.user(obj) y notifica', () => {
    const auth = fakeWebsanova();
    const adapter = websanovaAuthAdapter(auth);
    const cb = vi.fn();
    adapter.onUserChange(cb);
    adapter.setUser({ id: 1 });
    expect(auth.user).toHaveBeenCalledWith({ id: 1 });
    expect(adapter.user()).toEqual({ id: 1 });
    expect(cb).toHaveBeenCalledWith({ id: 1 });
  });

  it('logout notifica null; getToken usa auth.token()', () => {
    const auth = fakeWebsanova();
    const adapter = websanovaAuthAdapter(auth);
    adapter.setUser({ id: 1 });
    const cb = vi.fn();
    adapter.onUserChange(cb);
    adapter.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(null);
    expect(adapter.getToken()).toBe('tok');
  });
});

describe('authServiceAdapter', () => {
  it('encadena onUserChange sin pisar el callback previo', async () => {
    const service = fakeAuthService();
    const previous = vi.fn();
    service.onUserChange = previous;
    const adapter = authServiceAdapter(service);
    const cb = vi.fn();
    adapter.onUserChange(cb);
    await adapter.login({ username: 'u', password: 'p' });
    expect(service.login).toHaveBeenCalledWith({ data: { username: 'u', password: 'p' }, redirect: undefined });
    expect(previous).toHaveBeenCalledWith({ id: 7 });
    expect(cb).toHaveBeenCalledWith({ id: 7 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('login fallido ({ success: false }) rechaza', async () => {
    const adapter = authServiceAdapter(fakeAuthService({ success: false }));
    await expect(adapter.login({ username: 'u', password: 'x' })).rejects.toThrow('401');
  });
});

describe('adaptAuth', () => {
  it('detecta websanova, AuthService o un adaptador propio', () => {
    expect(adaptAuth(fakeWebsanova()).getToken()).toBe('tok');
    expect(adaptAuth(fakeAuthService()).getToken()).toBe('svc-token');
    expect(adaptAuth({ getToken: () => 'mio' }).getToken()).toBe('mio');
  });

  it('cachea por objeto y respeta un adaptador ya armado', () => {
    const auth = fakeWebsanova();
    expect(adaptAuth(auth)).toBe(adaptAuth(auth));
    const built = createAuthAdapter({});
    expect(adaptAuth(built)).toBe(built);
  });
});

describe('createAuthAdapter (vacío)', () => {
  it('login rechaza con un mensaje claro y el resto no rompe', async () => {
    const adapter = createAuthAdapter();
    await expect(adapter.login({ username: 'u', password: 'p' })).rejects.toThrow(/adaptador de auth/);
    expect(adapter.user()).toBeNull();
    expect(adapter.getToken()).toBeNull();
    expect(adapter.check()).toBe(false);
  });
});

describe('useHistrixAuth', () => {
  it('fuera de setup usa config.auth', () => {
    config.auth = { getToken: () => 'desde-config' };
    const auth = useHistrixAuth();
    config.auth = undefined;
    expect(auth.getToken()).toBe('desde-config');
  });
});
