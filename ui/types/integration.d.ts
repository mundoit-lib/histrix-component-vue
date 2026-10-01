/**
 * Contratos de integración: lo que una app puede inyectar en la librería
 * (`app.use(HistrixPlugin, { bus, auth, http, storage, onNavigate })`).
 * Sin inyectar nada se usan plugin-vue-event, plugin-vue-auth y
 * plugin-vue-axios si están instalados.
 */

/** Bus de eventos (services/bus.js). plugin-vue-event ya lo cumple. */
export interface HistrixBus {
  emit(name: string, ...args: unknown[]): void;
  on(name: string, handler: (...args: unknown[]) => void): () => void;
  off(name: string, handler: (...args: unknown[]) => void): void;
}

/** Pedido OAuth2 que arma `useApi().login` (los adaptadores pueden ignorarlo). */
export interface HistrixLoginRequest {
  url: string;
  data: Record<string, unknown>;
  method?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export interface HistrixLoginCredentials {
  username: string;
  password: string;
  request?: HistrixLoginRequest;
  redirect?: unknown;
}

/** Adaptador de auth (services/auth.js). Todos los métodos son opcionales al inyectarlo. */
export interface HistrixAuth<TUser = Record<string, unknown>> {
  login(credentials: HistrixLoginCredentials): Promise<unknown>;
  logout(options?: { redirect?: unknown }): unknown;
  user(): TUser | null;
  setUser(user: TUser | null): void;
  getToken(): string | null;
  check(): boolean;
  onUserChange(cb: (user: TUser | null) => void): () => void;
}

/** Persistencia (services/storage.js). */
export interface HistrixStorage {
  get(key: string): string | null;
  set(key: string, value: string | null): void;
  remove?(key: string): void;
}

/** Navegación (services/navigation.js). `to` es null cuando `back` es true. */
export type HistrixNavigate = (to: unknown, options: { replace: boolean; back: boolean }) => void;

/** Textos de la librería (services/i18n.js). vue-i18n cumple con `{ t: i18n.global.t }`. */
export interface HistrixI18n {
  t(key: string, params?: Record<string, unknown>): string;
  locale?: { value: string };
}

/** Diccionarios por locale: claves planas con namespace ('table.perPage'). */
export type HistrixMessages = Record<string, Record<string, string>>;

/** Opciones de `app.use(HistrixPlugin, options)`. */
export interface HistrixPluginOptions {
  notify?: Record<string, (...args: unknown[]) => unknown>;
  bus?: Partial<HistrixBus> & { fire?: (name: string, ...args: unknown[]) => void };
  auth?: Partial<HistrixAuth> | object;
  /** Instancia tipo axios. */
  http?: unknown;
  /** false: no persistir nada; sin definir: localStorage. */
  storage?: HistrixStorage | false;
  onNavigate?: HistrixNavigate;
  onUnauthorized?: (error: unknown) => void;
  /** Locale inicial (default 'es'). */
  locale?: string;
  /** Mensajes propios que se mezclan con los de la lib, por locale. */
  messages?: HistrixMessages;
  /** Implementación propia (p. ej. `{ t: i18n.global.t }`); pisa locale y messages. */
  i18n?: HistrixI18n;
}

export interface HistrixClientOptions {
  http?: unknown;
  host?: string | (() => string);
  db?: string | (() => string);
  auth?: Partial<HistrixAuth> | object;
  storage?: HistrixStorage;
}
