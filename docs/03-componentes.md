# 03 — Componentes y widgets

Listado de lo que vive en `ui/src/components/`. Todos los componentes top-level inyectan funciones de `useApi()` (ver `04-servicios.md`) vía `setup()`, lo que les da acceso a `axios` y a `auth` configurados por la app consumidora.

## Componentes top-level (`ui/src/components/`)

| Componente | Propósito | Props principales | Eventos emitidos |
|---|---|---|---|
| **HistrixApp** | Orquestador raíz: pide el schema (`getAppSchema`) y, según `histrix_type`, monta `HistrixForm` / `HistrixTable` / `HistrixCalendar` / `HistrixDashboard` / `HistrixTree` / `HistrixList` / `HistrixChart`. | `path`, `query`, `styles`, `title`, `inner`, `pdf`, `modelValue`, `database`, `api`, `finalStep` | `input`, `advance-step`, `process-finish`, `select-row`, `computed-total`, `closepopup` |
| **HistrixForm** | Formulario validado con Vuelidate. Soporta insert/update/process, upload, computed fields y submit `PATCH/PUT/POST`. | `title`, `inner`, `path`, `newRecord`, `url`, `query`, `schema`, `resources`, `editedItem`, `editedRow`, `editedIndex`, `computedFields` | (varía según slot/uso) |
| **HistrixTable** | Tabla con filtros, paginación, edición inline + popup, export (Excel/PDF/CSV/XML), totales computados, fórmulas. Es el componente más pesado de la lib (~35 KB). | `inner`, `path`, `query`, `schema`, `resources`, `valueFilter`, `title`, `search`, `computedFields`, `computedTotals`, `modelValue`, `isFormulation` | `export`, `print`, `computed-total`, `input`, `closepopup`, `open-popup`, `select-row` |
| **HistrixField** | Render polimórfico de un campo individual (text, select, file, picture, editor, checkbox, toggle, decimal, email, date, map, etc.). Lazy-loads `HistrixApp` y `HistrixFileManager`. | `schema`, `rowSchema`, `query`, `modelValue`, `row`, `submitting`, `path` | `selectOption`, `computed-total`, `fill-fields`, `input`, `field-change` |
| **HistrixCell** | Render polimórfico de una celda de tabla (thumb, link, map estático Google Maps, progreso, etc.). | `schema`, `value`, `col`, `path` | `open-popup` |
| **HistrixCalendar** | Vista calendario sobre `@quasar/quasar-ui-qcalendar`. | (ver fichero) | `input` |
| **HistrixDashboard** | Grid de widgets/iframes definidos en el schema. Cada celda monta un `HistrixApp` lazy. | `schema`, `resources` | — |
| **HistrixChart** | Gráficos con `vue-echarts` (líneas, barras, pie, según schema). | `schema`, `data`, `chart` | — |
| **HistrixList** | Lista simple (no tabla) con filtros, click → push a `name: 'form'`. | `path`, `schema`, `resources` | — |
| **HistrixTree** | Variante árbol de `HistrixTable`. | similares a HistrixTable | `export`, `print` |
| **HistrixFilters** | Panel de filtros usado por Table/List. | `schema`, `show` | `filter-data` |
| **HistrixPasswordChange** | Form de cambio de contraseña (usa `changePassword` de la API). | (ver fichero) | `close` |
| **HistrixLoginSplit** | **Login nativo (HTML + CSS scoped, sin Quasar)**: layout split (form + panel con foto/gradiente). Customizable por props (`brand`, `logo`, `image`, `primaryColor`, textos) y slots (`#brand`/`#panel`/`#footer`). Lógica vía `useApi().login()`. Opcionales: select de DB (`show-database`, busca con `apiDBQuery` y persiste la elegida en `config.db`+`localStorage`) y enlaces a registro / recupero (`show-register`, `show-forgot-password`, con destinos `register-to`/`forgot-password-to`). **Primer componente de la migración Quasar → nativo** (ver `08-plan-evolucion.md` Fase 3). | `nextUrl`, `brand`, `logo`, `image`, `primaryColor`, `tagline`, `title`, `subtitle`, `showDatabase`, `showRegister`, `showForgotPassword`, … | `success`, `error`, `db-change` |
| **HistrixRegisterSplit** | **Registro nativo** (misma familia visual `htx-auth` que el login). Campos **obligatorios fijos** → payload `{ nombre_cuenta, email, telefono, profile_id, password, confirm_password, props }`; teléfono se normaliza a dígitos (`strip-phone`). La info extra va a `props` y la define el cliente: declarativa vía `extra-fields` (`{name,label,type,options,required,format}`, se renderiza con el estilo del componente) o slot scoped `#extra="{ props }"` para inputs complejos (máscaras, autocompletado async). Lógica vía `useApi().register()`. Select de DB opcional (`show-database`). | `brand`, `logo`, `image`, `primaryColor`, `profileId`, `extraFields`, `stripPhone`, `passwordMinLength`, `loginTo`, `showDatabase`, … | `success`, `error`, `db-change` |
| **HistrixForgotPasswordSplit** | **Recuperar contraseña** (pide el mail de recupero). Campo email → `useApi().resetPassword({ email, recover, db })`; `recover-url` apunta a la pantalla de reseteo del cliente. Muestra estado "enviado" inline (sin `q-notify`). Select de DB opcional (`show-database`); el `db` enviado usa `currentDb()`. | `brand`, `logo`, `image`, `primaryColor`, `recoverUrl`, `loginTo`, `showDatabase`, … | `success`, `error`, `db-change` |
| **HistrixResetPasswordSplit** | **Fijar nueva contraseña con token** (pantalla a la que apunta el link del mail). Lee `token`/`email` de la query (o por props) → `useApi().resetPassword({ email, password, confirm_password, token, recover, db })`. Estados de éxito y de link expirado (`validate-token` usa `getValidToken`). Select de DB opcional (`show-database`). | `brand`, `logo`, `image`, `primaryColor`, `token`, `email`, `recoverUrl`, `validateToken`, `passwordMinLength`, `loginTo`, `forgotPasswordTo`, `showDatabase`, … | `success`, `error`, `db-change` |
| **LoginForm** | Form de login estilado con Quasar. Llama `useApi().login()`. | (ver fichero) | — |
| **FormLoginNotStyles** | Variante de `LoginForm` sin estilos opinionados (lleva su CSS desde la app consumidora). Incluye links a `register` y `mail-reset-password`. | (ver fichero) | — |
| **InputPassword** | Input con toggle show/hide y validaciones de fuerza. | (ver fichero) | `show`, `hide` |
| **ExportForm** | Selector de formato de export (Excel/PDF/CSV/XML) usado desde `HistrixTable`. | (ver fichero) | — |

## Widgets (`ui/src/components/widgets/`)

| Widget | Propósito | Notas |
|---|---|---|
| **HistrixMenu** | Árbol de menú a partir de `getMenu(level)`. Construye rutas tipo `/auth/{uri}`. | Usa `q-tree`. |
| **HistrixExpansionMenu** | Menú expandible con favoritos + featured + búsqueda. Persiste estado en `localStorage` (`menu.featuredOpen`, `menu.favoritesOpen`). | Emite `close-drawer` (agregado en v0.0.199). |
| **FavoritItems** | Listado de items favoritos del usuario. | Consume `getFavorites()`. |
| **DatabaseSelector** | Combo para elegir la DB activa contra un host Histrix. Emite el `id` por `input`. | Llama `getHostDb(host)`. |
| **HistrixConnectionSettings** | UI para cambiar host/DB. Emite `change-database`. | — |
| **HistrixFileManager** | Browser de archivos sobre `/dir/{path}` + `/files/{path}`. | Lazy-cargado desde `HistrixField`. |
| **HistrixLog** | Visor de logs (consume API de logs del backend). | — |
| **HistrixNews** | Widget de novedades / posts del sistema. | — |
| **HistrixUsers** | Listado/admin básico de usuarios. | — |
| **notificationMenu** | Menú dropdown de notificaciones (`getUserNotifications`). | — |
| **profileMenu** | Menú de perfil con rutas a `profile`, `systemSettings`, `about`. | — |
| **profileMenuItems** | Variante items-only del menú de perfil. Acepta prop `mini`. | — |

## Exposición pública (`ui/src/index.js`)

`install(app)` (Vue 3) registra **los 32 componentes** iterando una lista única — desde v0.1.0 se sumaron `HistrixConnectionSettings`, `HistrixFileManager` e `InputPassword` (antes solo por import directo) y la **familia de auth nativa** (`htx-auth`): `HistrixLoginSplit`, `HistrixRegisterSplit`, `HistrixForgotPasswordSplit` y `HistrixResetPasswordSplit`. El tag global de cada uno es su `name:` (`app.component(c.name, c)`). Todos siguen disponibles también por subpath (`package.json -> exports`) y como named exports del import raíz.

## Patrones recurrentes

- **Composition setup() + Options data/methods**: `setup()` se usa casi exclusivamente para inyectar funciones de `useApi()` y de `vuelidate`, el resto del componente sigue en Options API. Es herencia del período dual Vue 2/3 (válido en Vue 3); unificar estilo es candidato de Fase 2.
- **Lazy components**: `HistrixApp` y `HistrixFileManager` se cargan con `defineLazyComponent(() => import(...))` (helper propio en `services/asyncComponents.js`) para evitar ciclos de import y reducir el bundle inicial.
- **Localización del estado de DB**: `localStorage.database` y `localStorage.host` son la fuente de verdad runtime; `config.js` sólo aporta defaults desde env.
- **`v-model` Vue 3**: los componentes editables emiten `update:modelValue` (NO el `input` de Vue 2 — eso quedó roto tras la migración y se corrigió el 2026-06-08 en `HistrixField`, `HistrixForm`, `HistrixTable`, `HistrixCalendar` y `DatabaseSelector`, que además pasó su prop `value`→`modelValue`). Al agregar un componente con `v-model`, usar `modelValue` + `emit('update:modelValue')` y declararlo en `emits`.
- **Lógica del motor en `ui/src/core/`**: la lógica pura (evaluación de fórmulas, claves, tipos de pantalla/campo, options, filtros, fechas, visibilidad) vive en módulos testeables en `core/`; los componentes delegan en ellos vía wrappers finos. Ver `06-estado-actual.md`.
