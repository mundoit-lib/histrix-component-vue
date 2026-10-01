# 04 — Servicios y configuración

## `services/config.js`

Config global expuesta como `Proxy` (para lectura/escritura runtime desde la app consumidora). Lee de `process.env.*` en build time:

| Clave | Env var | Para qué |
|---|---|---|
| `db` | `DB` | DB Histrix por defecto |
| `baseUrl` | `BASE_URL` | URL pública del frontend |
| `mainUrl` | `MAIN_URL` | Endpoint del listado de DBs (usado en `apiDBQuery()`) |
| `apiUrl` | `API_URL` | URL del API cuando NO hay DB activa |
| `clientId` | `CLIENT_ID` | OAuth2 `client_id` |
| `clientSecret` | `CLIENT_SECRET` | OAuth2 `client_secret` |
| `fixApi` | `FIX_API_URL` | Host fijo de fallback (override del host vía localStorage) |
| `axios` | — | Slot para inyectar la instancia de axios desde afuera (hoy ya no se usa: `histrixApi` toma directamente la del plugin) |
| `onUnauthorized` | — | Callback ante un `401` (`onUnauthorized(error)`). Se setea a mano o con `app.use(HistrixPlugin, { onUnauthorized })`. La librería no navega sola. |

`config` se exporta como named (`{ config }`) y como default.

## `services/histrixApi.js` (`useApi()` factory)

Factory composable que devuelve el **cliente del backend Histrix** completo. Resuelve internamente:

- `auth = useAuth()` desde `@mundoit-lib/plugin-vue-auth`
- `axios = axiosInstance` desde `@mundoit-lib/plugin-vue-axios`

### Resolución de URL

```
currentDb() = localStorage.database || config.db
host()      = localStorage.host     || config.fixApi   ← NOTA: hoy NO usa config.apiUrl
apiUrl()    = `${host()}/api/db/${currentDb()}`  (si hay DB)
            | config.apiUrl                       (fallback sin DB)
```

> ⚠️ Hay un TODO marcado en `host()`: en producción debería volver a `config.apiUrl`. Hoy `fixApi` está hardcodeado como host efectivo.

### Métodos expuestos

| Método | Verbo | Endpoint |
|---|---|---|
| `getHostDb(host)` | GET | `{host}/api/db/` |
| `info()` | GET | `{host}/api/info/` |
| `getDatabaseInfo(db)` | GET | `{host}/api/db/{db}` |
| `apiDBQuery()` | GET | `config.mainUrl` (lista DBs visibles) |
| `login(user, pass, redirect)` | POST | `{apiUrl}/token` (OAuth2 password grant) + `getUser()` |
| `getUser()` / `getBasicDataUser()` | GET | `{apiUrl}/me` — guarda `user` en `localStorage` y en `auth.user()`. Redirige a `/auth/verify` si `verified == null`. |
| `getUserInfo()` | GET | `{apiUrl}/me/` |
| `getUsers()` | GET | `{apiUrl}/users/` |
| `getUserNotifications()` | GET | `{apiUrl}/user/notifications/` |
| `getMenu(level)` | GET | `{apiUrl}/menu/{level}?platform=app` |
| `register(form)` | POST | `{apiUrl}/registration/` |
| `confirmRegistration(data)` | POST | `{apiUrl}/confirm-registration/` |
| `reSendConfirmationMail(data)` | POST | `{apiUrl}/resend-confirmation/` |
| `changePassword(data)` | POST | `{apiUrl}/change-password/` |
| `resetPassword(form)` | POST | `{host}/api/resetpassword/` (a nivel host, **no** scopeado por `/api/db/`; la base viaja en el body `db`). Sirve para pedir el mail de recupero (`{email, recover, db}`) y para fijar la nueva contraseña con token (`{email, password, confirm_password, token, db}`). |
| `updateUser(form, userId)` | PUT | `{apiUrl}/app/users/current_user_form.xml` |
| `getValidToken(id)` | GET | `{apiUrl}/app/users/valid_token.xml?login=…` |
| `getAppSchema(path, params)` | GET | `{apiUrl}/schema/{path}` |
| `getAppData(path, params)` | GET | `{apiUrl}/app/{path}`. Devuelve la data normalizada (`core/apiResponse.js`): `204` o body vacío → `{ data: [] }`; acepta `{data}`, `{data, pagination}` y el envoltorio de DataTables |
| `getAppPdf(path, params)` | GET (arraybuffer) | `{apiUrl}/pdf/{path}` |
| `insertAppData(path, data)` | POST | `{apiUrl}/app/{path}` |
| `updateAppData(path, data)` | PUT | `{apiUrl}/app/{path}` |
| `processAppForm(path, data)` | PATCH | `{apiUrl}/app/{path}` (envuelve en `{data}`) |
| `processApp(path, data)` | PATCH | `{apiUrl}/app/{path}` (envuelve en `{jsonData}`) |
| `deleteAppData(path, keys)` | DELETE | `{apiUrl}/app/{path}` (body con `{keys}`) |
| `upload(files)` | POST | `{apiUrl}/files/{file.path}` (multipart por archivo) |
| `getFiles(path)` | GET | `{apiUrl}/dir/{path}` |
| `deleteFile(path)` | DELETE | `{apiUrl}/files/{path}` |
| `downloadAppData(path, query, fmt, fname)` | GET (blob) | `{apiUrl}/export/{fmt}/{path}` (URL armada con `buildExportUrl` de `core/export.js`) + dispara descarga local. `query` ya trae los filtros del listado y, para `csv`, `_delimiter`. **Retorna la promesa** y propaga el error (el consumidor lo muestra) |
| `getFavoritesOption()` | GET | `{apiUrl}/favorites/` (devuelve array) |
| `getFavorites()` | GET | `{apiUrl}/favorites/` (devuelve `{keys: […]}`) |
| `setFavorit(menuId, uri, name)` | PUT | `{apiUrl}/favorites/` |
| `removeFavorit(menuId)` | PUT | `{apiUrl}/favorites/` |
| `queryStringToObject(query)` | — | Util pura: parsea `URLSearchParams` a objeto con arrays para `?a[]=…&a[]=…`. |

> **`useApi()` es agnóstico de Quasar (desde 2026-06-08).** Antes `downloadAppData` mostraba un `Notify` de Quasar ante error de descarga (y se tragaba el error). Ahora el service no muestra UI: retorna la promesa y propaga; `ExportForm.vue` hace el `.catch` y muestra el `$q.notify`. `services/` quedó 100% libre de Quasar. El patrón a seguir: **el service propaga el error, la UI (componente) lo muestra**.

### Errores (`core/apiError.js`)

`useApi()` envuelve la instancia de axios con un wrapper local (no instala interceptores globales en la app): **todos los métodos rechazan con un `HistrixApiError`** `{status, kind, message, raw}`.

- `status`: el HTTP (`0` si no hubo respuesta).
- `kind`: `validation` (400/422), `auth` (401/403), `not_found` (404), `server` (5xx), `network` o `unknown`.
- `message`: texto legible. Si el backend manda HTML o texto, se le sacan los tags; si manda JSON, se toma `message`, `error`, `description` o `responseText`.
- `raw`: el error original de axios.

Un `401` además llama a `config.onUnauthorized(error)` si está definido. `isHistrixApiError(e)` se exporta desde la raíz.

### Notificaciones (`services/notify.js`)

Los componentes no deberían llamar a Quasar para avisar: usan un **notifier inyectable** con la interfaz `{ success(msg), error(msg, err?), info(msg), confirm(msg) → Promise<boolean> }`.

- `createNotifier(impl)` completa una implementación parcial (lo que falte cae a la consola).
- `provideHistrixNotify(app, impl)` lo registra; `useHistrixNotify()` lo obtiene en un componente.
- `services/notify.quasar.js` es la implementación por defecto (`Notify` y `Dialog` de Quasar). El plugin la registra salvo que la app pase `options.notify`.

`services/notify.js` no depende de Quasar; sólo `notify.quasar.js` lo usa. Pasar los componentes al notifier (y sacar `alert`/`confirm`) es la subtarea HD-7521.

### Export (`core/export.js`)

La parte testeable del export vive en `ui/src/core/export.js` (27 tests); el service sólo hace la descarga binaria (Blob + `<a download>`).

| Export | Qué hace |
|---|---|
| `EXPORT_FORMATS` | Formatos en el orden del diálogo: `xls` (Excel), `pdf`, `csv` (`hasDelimiter: true`) y `xml`, con ícono y color. |
| `DEFAULT_DELIMITER` | `','` |
| `getFormatExtension(fmt)` / `findFormat(fmt)` / `formatHasDelimiter(fmt)` | Consultas sobre la tabla de formatos. |
| `sanitizeFileName(name)` / `buildExportFileName(title, fmt)` | Nombre de archivo a partir del título de la pantalla. |
| `parseQueryString(query)` | Parsea el querystring de filtros del listado (`_f[]/_o[]/_v[]`, ver `core/filters.js`) a objeto. |
| `buildExportParams({ query, exportQuery, format, delimiter })` | Mezcla los parámetros de la pantalla con los filtros; agrega `_delimiter` sólo si el formato lo acepta. |
| `buildExportUrl(apiBase, fmt, path)` | `{apiBase}/export/{fmt}/{path}` |

Flujo: `HistrixTable` abre `ExportForm` → el usuario elige formato (y delimitador si es CSV) → `buildExportParams` + `buildExportFileName` → `useApi().downloadAppData(path, params, fmt, fileName)`.

### API de favoritos — nota

Refactorizada en `d2fa119`. Hoy la API:
- `GET /favorites/` puede devolver **array directo** o **objeto `{favorites:[]}`** — ambos casos están manejados.
- `setFavorit` y `removeFavorit` hacen **leer → mutar → PUT del array completo**. No hay endpoint POST/DELETE individual.

## `services/histrix-bearer.js`

Driver "bearer token" para `@mundoit-lib/plugin-vue-auth`: `request()` setea `Authorization: Bearer {token}` y `response()` extrae `access_token` del payload OAuth del login. En la Fase 1 se redujo al mínimo funcional (se eliminó el código comentado y un cálculo roto de expiración que nunca se usó). Las apps lo pasan como `authDriver` al configurar el plugin (el playground `ui/dev/` lo hace así). El manejo fino de `refresh_token`/`expires_in` sigue pendiente.

## `services/asyncComponents.js`

Helper `defineLazyComponent(loader, options)` (Vue 3): envuelve `defineAsyncComponent({ loader, loadingComponent, errorComponent, delay, timeout })` con defaults de UI — spinner `'Cargando...'` y error `'Error al cargar componente'`. Acepta una función loader `() => import('...')` (lazy real, el uso estándar) o una Promise ya disparada (compat con call-sites viejos). Normaliza módulos ESM/CJS.

Usado por `HistrixApp` (mapa `schema.type` → componente), `HistrixField` y `HistrixDashboard`, donde hay dependencias circulares con `HistrixApp` o se quiere code-splitting.

> Hasta v0.0.x se llamaba `defineAsyncComponentCompat` y tenía una rama Vue 2 (`vue-demi`); se renombró y simplificó en la Fase 1.

## Peers opcionales: `$events` y `$router`

Además de los peers obligatorios, `ui/package.json` declara dos **peers opcionales** (`peerDependenciesMeta`). Los componentes que los usan sólo funcionan si la app los instaló:

- **`@mundoit-lib/plugin-vue-event`** (bus `$events`): `HistrixForm`, `HistrixTable`, `HistrixExpansionMenu`, `FormLoginNotStyles` y `HistrixLoginSplit` disparan eventos por ahí (lista en `03-componentes.md`). `HistrixLoginSplit` chequea que exista; el resto falla si no está.
- **`vue-router@^4`** (`$router`): `HistrixApp` (redirect), `HistrixForm`, `HistrixList`, `HistrixTable`, `HistrixTree`, `HistrixExpansionMenu` y `HistrixMenuSearch` navegan con `push`/`replace`.

La subtarea de higiene **HD-7526** los reemplaza por emits/`provide` para que la librería no dependa de ninguno de los dos.
