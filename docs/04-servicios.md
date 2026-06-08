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
| `updateUser(form, userId)` | PUT | `{apiUrl}/app/users/current_user_form.xml` |
| `getValidToken(id)` | GET | `{apiUrl}/app/users/valid_token.xml?login=…` |
| `getAppSchema(path, params)` | GET | `{apiUrl}/schema/{path}` |
| `getAppData(path, params)` | GET | `{apiUrl}/app/{path}` |
| `getAppPdf(path, params)` | GET (arraybuffer) | `{apiUrl}/pdf/{path}` |
| `insertAppData(path, data)` | POST | `{apiUrl}/app/{path}` |
| `updateAppData(path, data)` | PUT | `{apiUrl}/app/{path}` |
| `processAppForm(path, data)` | PATCH | `{apiUrl}/app/{path}` (envuelve en `{data}`) |
| `processApp(path, data)` | PATCH | `{apiUrl}/app/{path}` (envuelve en `{jsonData}`) |
| `deleteAppData(path, keys)` | DELETE | `{apiUrl}/app/{path}` (body con `{keys}`) |
| `upload(files)` | POST | `{apiUrl}/files/{file.path}` (multipart por archivo) |
| `getFiles(path)` | GET | `{apiUrl}/dir/{path}` |
| `deleteFile(path)` | DELETE | `{apiUrl}/files/{path}` |
| `downloadAppData(path, query, fmt, fname)` | GET (blob) | `{apiUrl}/export/{fmt}/{path}` + dispara descarga local. **Retorna la promesa** y propaga el error (el consumidor lo muestra) |
| `getFavoritesOption()` | GET | `{apiUrl}/favorites/` (devuelve array) |
| `getFavorites()` | GET | `{apiUrl}/favorites/` (devuelve `{keys: […]}`) |
| `setFavorit(menuId, uri, name)` | PUT | `{apiUrl}/favorites/` |
| `removeFavorit(menuId)` | PUT | `{apiUrl}/favorites/` |
| `queryStringToObject(query)` | — | Util pura: parsea `URLSearchParams` a objeto con arrays para `?a[]=…&a[]=…`. |

> **`useApi()` es agnóstico de Quasar (desde 2026-06-08).** Antes `downloadAppData` mostraba un `Notify` de Quasar ante error de descarga (y se tragaba el error). Ahora el service no muestra UI: retorna la promesa y propaga; `ExportForm.vue` hace el `.catch` y muestra el `$q.notify`. `services/` quedó 100% libre de Quasar. El patrón a seguir: **el service propaga el error, la UI (componente) lo muestra**.

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
