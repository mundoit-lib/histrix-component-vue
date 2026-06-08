# Histrix Dev Playground

App Vite + Vue 3 + Quasar 2 + **UnoCSS** para **smoke-testear** la librería
`@mundoit-lib/histrix-component-vue` (enlazada como `link:..` desde `ui/` —
symlink vivo: editar `ui/src` se refleja al instante con HMR)
contra un backend Histrix real.

La configuración replica el patrón de las **apps reales de Mundo IT**
(referencia: `angel-alvarez-frontend`): mismos plugins (`plugin-vue-axios`,
`plugin-vue-auth` con sus defaults, `plugin-vue-event`), mismo mapeo de env,
mismo guard de router, y UnoCSS (presetUno + presetWind) para clases utility
estilo Tailwind que conviven con Quasar (`unocss.config.js`).

La librería es *source-only*: sus componentes `.vue` se compilan en vivo con el
plugin de Vue de Vite (por eso está en `optimizeDeps.exclude`).

> **Package manager: pnpm** (como todo el repo). Con `link:..` pnpm **no**
> instala las dependencias de la librería enlazada, por eso `ui/` tiene su
> propio `pnpm install` (ver "Correr").

## Configuración

1. El `.env` ya viene cargado con el backend de prueba de **Angel Álvarez**
   (host, db, credenciales OAuth y usuario de prueba — copiados de
   `angel-alvarez-frontend`). Para apuntar a otro backend, editalo o
   regeneralo desde el ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Variables (`.env`):

   | Variable | Para qué |
   |---|---|
   | `VITE_HISTRIX_HOST` | Host del backend, sin slash final. Se vuelca a `config.fixApi` (host efectivo) y `config.apiUrl`. |
   | `VITE_HISTRIX_DB` | Base/cliente Histrix por defecto (el `{db}` de `/api/db/{db}/...`). |
   | `VITE_CLIENT_ID` | `client_id` OAuth2 (password grant). |
   | `VITE_CLIENT_SECRET` | `client_secret` OAuth2. |
   | `VITE_HISTRIX_MAIN_URL` | (opcional) endpoint que lista DBs visibles. Default: `${VITE_HISTRIX_HOST}/api/db/`. |

   Estos valores se vuelcan en runtime a la config de la librería en
   [`src/setup.js`](./src/setup.js) (no se toca `config.js` de la librería).

   Recordá la resolución de URL de `histrixApi.js`:
   - `host()` = `localStorage.host` || `config.fixApi`
   - `currentDb()` = `localStorage.database` || `config.db`
   - `apiUrl()` = `` `${host()}/api/db/${currentDb()}` ``

## Correr

```bash
# 1. Deps de la librería (una vez, o cuando cambien sus dependencies):
cd ui && pnpm install

# 2. Playground:
cd dev
pnpm install
pnpm dev         # http://localhost:5180
```

`pnpm build` y `pnpm preview` también están disponibles. `pnpm build` compila
**todos** los `.vue` de la librería — es el smoke test de compilación del repo.

> pnpm 10 bloquea los postinstall de dependencias por defecto. Los necesarios
> (`esbuild`, `vue-demi`) ya están autorizados en `package.json -> pnpm.onlyBuiltDependencies`.
> El de `@mundoit-lib/plugin-vue-auth` (`npx vue-demi-fix`) queda bloqueado a
> propósito: es innecesario acá (vue-demi ya queda en modo Vue 3 y `dedupe`
> fuerza la copia del playground).

## Uso

1. `/login` — formulario de login de la librería (`FormLoginNotStyles`), pega a
   `POST /api/db/{db}/token`.
2. `/` (home) — input para tipear el path de un XML y abrirlo.
3. `/app/:path` — monta `<HistrixApp :path="..." />` (pide el schema y renderiza
   la pantalla). El drawer muestra `HistrixExpansionMenu` con el menú del usuario.

## Notas de integración

- `vite.config.js` define `process.env: {}` porque `config.js` de la librería
  lee `process.env.*` (en el browser no existe `process`).
- `resolve.dedupe` garantiza una sola copia de `vue`/`vue-demi`/`quasar`/Vuelidate
  aunque `ui/node_modules` tenga las suyas; el alias `quasar/src/` se resuelve
  con `require.resolve` (portable entre npm y pnpm — nunca rutas a mano).
- Plugins `@mundoit-lib/plugin-vue-axios` (HTTP) y `@mundoit-lib/plugin-vue-auth`
  (auth) se instalan en [`src/main.js`](./src/main.js) con la **misma forma que
  los boot files de las apps reales**: el auth solo recibe
  `{ plugins: { http: axiosInstance, router } }` — sus defaults ya son los
  correctos para Histrix (`tokenDefaultKey: 'accessToken'`, driver que extrae
  `res.data.access_token`).
- `$events` lo provee `@mundoit-lib/plugin-vue-event` (v1.0.2: named export
  `eventsPlugin`; la 1.0.0 de apps viejas usaba default export). La librería lo
  usa para `login-ok`, `loaded-user`, `closepopup`, `update-favorit`, etc.
- `setup.js` además pre-setea `localStorage.host`/`localStorage.database`
  (igual que el boot de axios de las apps reales).
