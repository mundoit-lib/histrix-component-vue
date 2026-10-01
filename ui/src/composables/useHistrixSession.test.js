import { afterEach, describe, expect, it, vi } from 'vitest';
import { authServiceAdapter } from '../services/auth.js';
import config from '../services/config.js';
import { useHistrixSession } from './useHistrixSession.js';

afterEach(() => {
  config.auth = undefined;
  config.http = undefined;
  config.storage = undefined;
});

describe('useHistrixSession', () => {
  it('login/logout actualizan user e isLogged; onUserChange también', async () => {
    let user = null;
    const service = {
      onUserChange: null,
      login: vi.fn(async () => {
        user = { id: 1, verified: 1 };
        return { success: true };
      }),
      logout: vi.fn(() => {
        user = null;
      }),
      user: () => user,
      token: () => 't',
      check: () => Boolean(user)
    };
    const http = vi.fn();
    http.get = vi.fn(() => Promise.resolve({ data: { id: 1, verified: 1 } }));
    config.auth = authServiceAdapter(service);
    config.http = http;
    config.storage = false;

    const session = useHistrixSession();
    expect(session.isLogged.value).toBe(false);
    await session.login('u', 'p');
    expect(session.user.value).toEqual({ id: 1, verified: 1 });
    expect(session.isLogged.value).toBe(true);

    service.onUserChange({ id: 2 });
    expect(useHistrixSession().user.value).toEqual({ id: 2 });

    session.logout();
    expect(session.isLogged.value).toBe(false);
    expect(service.logout).toHaveBeenCalled();
  });
});
