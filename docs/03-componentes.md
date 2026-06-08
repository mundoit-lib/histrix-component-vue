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
| **HistrixLoginSplit** | **Login nativo (HTML + CSS scoped, sin Quasar)**: layout split (form + panel con foto/gradiente). Customizable por props (`brand`, `logo`, `image`, `primaryColor`, textos) y slots (`#brand`/`#panel`/`#footer`). Lógica vía `useApi().login()`. **Primer componente de la migración Quasar → nativo** (ver `08-plan-evolucion.md` Fase 3). | `nextUrl`, `brand`, `logo`, `image`, `primaryColor`, `tagline`, `title`, `subtitle`, … | `success`, `error` |
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

`install(app)` (Vue 3) registra **los 29 componentes** iterando una lista única — desde v0.1.0 se sumaron `HistrixConnectionSettings`, `HistrixFileManager` e `InputPassword` (antes solo por import directo) y `HistrixLoginSplit` (nuevo, nativo). El tag global de cada uno es su `name:` (`app.component(c.name, c)`). Todos siguen disponibles también por subpath (`package.json -> exports`) y como named exports del import raíz.

## Patrones recurrentes

- **Composition setup() + Options data/methods**: `setup()` se usa casi exclusivamente para inyectar funciones de `useApi()` y de `vuelidate`, el resto del componente sigue en Options API. Es herencia del período dual Vue 2/3 (válido en Vue 3); unificar estilo es candidato de Fase 2.
- **Lazy components**: `HistrixApp` y `HistrixFileManager` se cargan con `defineLazyComponent(() => import(...))` (helper propio en `services/asyncComponents.js`) para evitar ciclos de import y reducir el bundle inicial.
- **Localización del estado de DB**: `localStorage.database` y `localStorage.host` son la fuente de verdad runtime; `config.js` sólo aporta defaults desde env.
- **`v-model` Vue 3**: los componentes editables emiten `update:modelValue` (NO el `input` de Vue 2 — eso quedó roto tras la migración y se corrigió el 2026-06-08 en `HistrixField`, `HistrixForm`, `HistrixTable`, `HistrixCalendar` y `DatabaseSelector`, que además pasó su prop `value`→`modelValue`). Al agregar un componente con `v-model`, usar `modelValue` + `emit('update:modelValue')` y declararlo en `emits`.
- **Lógica del motor en `ui/src/core/`**: la lógica pura (evaluación de fórmulas, claves, tipos de pantalla/campo, options, filtros, fechas, visibilidad) vive en módulos testeables en `core/`; los componentes delegan en ellos vía wrappers finos. Ver `06-estado-actual.md`.
