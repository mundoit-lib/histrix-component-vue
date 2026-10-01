// Autenticación inyectable. Interfaz del adaptador:
//   login({ username, password, request, redirect }) → Promise
//   logout({ redirect }?)            user() → objeto | null
//   setUser(user)                    getToken() → string | null
//   check() → boolean                onUserChange(cb) → unsubscribe
//
// `request` es el pedido OAuth2 que arma `useApi().login` (url, data, headers…);
// un adaptador que ya sabe a dónde loguearse puede ignorarlo.
//
// Resolución (useHistrixAuth): el inyectado (`provideHistrixAuth` o
// `app.use(HistrixPlugin, { auth })`) → `config.auth` → `$auth` de la app
// (plugin-vue-auth 1.x/websanova, o el AuthService nuevo) → sin auth.
import { getCurrentInstance, inject, watch } from 'vue';
import { globalProperty } from './appContext.js';
import config from './config.js';

export const HISTRIX_AUTH_KEY = Symbol('histrixAuth');

/** Completa un adaptador parcial y le agrega el manejo de `onUserChange`. */
export function createAuthAdapter(impl = {}) {
  if (impl.__histrixAuth) return impl;
  const listeners = new Set();
  let last;
  const notify = (user) => {
    if (user === last) return;
    last = user;
    for (const cb of [...listeners]) {
      try {
        cb(user);
      } catch (error) {
        console.error(error);
      }
    }
  };
  const call = (name, fallback) => (typeof impl[name] === 'function' ? impl[name] : fallback);
  const readUser = () => call('user', () => null)() ?? null;

  if (typeof impl.subscribe === 'function') impl.subscribe(notify);

  return {
    __histrixAuth: true,
    async login(credentials) {
      const result = await call('login', () =>
        Promise.reject(new Error('Histrix: no hay adaptador de auth configurado.'))
      )(credentials);
      notify(readUser());
      return result;
    },
    logout(options = {}) {
      const result = call('logout', () => undefined)(options);
      notify(null);
      return result;
    },
    user: readUser,
    setUser(user) {
      call('setUser', () => undefined)(user);
      notify(user ?? null);
    },
    getToken: () => call('getToken', () => null)() ?? null,
    check: () => Boolean(call('check', () => Boolean(readUser()))()),
    onUserChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }
  };
}

/** Adaptador sobre `$auth` / `useAuth()` de plugin-vue-auth 1.x (websanova). */
export function websanovaAuthAdapter(auth) {
  return createAuthAdapter({
    login({ username, password, request = {}, redirect } = {}) {
      return auth.login({
        data: { username, password },
        fetchUser: false,
        ...request,
        redirect: redirect || ''
      });
    },
    logout: (options) => auth.logout(options),
    user: () => auth.user() || null,
    setUser: (user) => auth.user(user),
    getToken: () => (typeof auth.token === 'function' ? auth.token() : null),
    check: () => (typeof auth.check === 'function' ? auth.check() : Boolean(auth.user())),
    // El user de websanova es reactivo: cambios hechos por la app también llegan.
    subscribe(notify) {
      try {
        watch(
          () => auth.user(),
          (user) => notify(user || null)
        );
      } catch {
        // Sin reactividad disponible: sólo se notifican los cambios que hace la librería.
      }
    }
  });
}

/** Adaptador sobre el `AuthService` nuevo de plugin-vue-auth (onUserChange). */
export function authServiceAdapter(service) {
  return createAuthAdapter({
    async login({ username, password, redirect } = {}) {
      const result = await service.login({ data: { username, password }, redirect });
      if (result && result.success === false) throw result.error || new Error('Login fallido');
      return result;
    },
    logout: (options) => service.logout(options),
    user: () => service.user() || null,
    // El AuthService maneja su propio usuario (lo trae de /me tras el login).
    setUser: () => undefined,
    getToken: () => service.token(),
    check: () => service.check(),
    subscribe(notify) {
      const previous = service.onUserChange;
      service.onUserChange = (user) => {
        if (typeof previous === 'function') previous(user);
        notify(user || null);
      };
    }
  });
}

const isWebsanova = (auth) => typeof auth.redirect === 'function' && typeof auth.user === 'function';
const isAuthService = (auth) => 'onUserChange' in auth && typeof auth.token === 'function';

const adapters = new WeakMap();

/** Elige el adaptador según la forma del objeto (`$auth` o un adaptador propio). */
export function adaptAuth(auth) {
  if (!auth) return null;
  if (auth.__histrixAuth) return auth;
  if (adapters.has(auth)) return adapters.get(auth);
  let adapter;
  if (isWebsanova(auth)) adapter = websanovaAuthAdapter(auth);
  else if (isAuthService(auth)) adapter = authServiceAdapter(auth);
  else adapter = createAuthAdapter(auth);
  adapters.set(auth, adapter);
  return adapter;
}

const noAuth = createAuthAdapter();
let providedAuth = null;

export function provideHistrixAuth(app, auth) {
  providedAuth = adaptAuth(auth);
  app.provide(HISTRIX_AUTH_KEY, providedAuth);
  return providedAuth;
}

/** Adaptador resuelto: inyectado → config.auth → $auth → sin auth. */
export function useHistrixAuth() {
  const injected = getCurrentInstance() ? inject(HISTRIX_AUTH_KEY, null) : null;
  if (injected) return injected;
  if (providedAuth) return providedAuth;
  if (config.auth) return adaptAuth(config.auth);
  const auth = globalProperty('$auth');
  if (auth) return adaptAuth(auth);
  return noAuth;
}
