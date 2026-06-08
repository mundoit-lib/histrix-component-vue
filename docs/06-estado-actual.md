# 06 — Estado actual y notas

> Snapshot al **2026-06-08**, `main`, paquete v**0.1.0** (primera versión Vue 3 only — pendiente de tag/publicación).

## Lo último que se movió: Fase 1 del plan de evolución (2026-06-05)

Se ejecutó completa la **Fase 1 — Sanear** de [`08-plan-evolucion.md`](08-plan-evolucion.md). En resumen:

- **Drop de Vue 2**: fuera `vue-demi`, `isVue2/isVue3`, sintaxis `.sync` (→ `v-model:prop`), `@vue/composition-api`. `defineAsyncComponentCompat` → `defineLazyComponent` (Vue 3 puro) y todos los call-sites pasaron de `import(...)` ya disparado a `() => import(...)` (lazy real).
- **`ui/package.json` v0.1.0**: `main`/`module`/`exports["."]` apuntan a `src/index.esm.js` (el import raíz ahora funciona); `files: ["src"]`; peers explícitos `vue ^3.2` y `quasar ^2`; fuera `vue-picture-input` (muerta) y todo el tooling del build legacy. `node_modules` regenerado con **pnpm** (`pnpm-lock.yaml` nuevo; ya no convive un Vue 2/Quasar 1 fantasma).
- **Borrado**: `ui/build/` (pipeline Rollup), `index.common.js`, `index.umd.js`, `index.sass`, `umd-test.html`, `.npmignore` (redundante con `files`), y el playground viejo de Quasar CLI 2.
- **`index.js`**: `install(app)` registra iterando una lista; se sumaron al registro global `HistrixConnectionSettings`, `HistrixFileManager` e `InputPassword`; se exporta `config`.
- **Bugs de `name` resueltos**: `HistrixTree` ya no se declara `'HistrixTable'` (pisaba el registro global de la tabla real); typo `'HistrixConectionSettings'` corregido.
- **Limpieza**: ~25 `console.log` de debug eliminados (los de catch de red → `console.error`), ~150 líneas de código comentado muerto afuera, `histrix-bearer.js` reducido al driver mínimo funcional.
- **Playground nuevo en `ui/dev/`**: Vite + Vue 3 + Quasar 2, consume la lib vía `link:..` (symlink vivo con HMR, prueba los `exports` reales), login contra backend real, ruta `/app/:path` que monta cualquier XML. Todo con **pnpm**. Ver `ui/dev/README.md`.
- **Verificado**: `pnpm build` del playground compila los 28 `.vue` de la librería con Vue 3 + Quasar 2 reales (exit 0); `pnpm dev` levanta y transforma los `.vue` de la lib a través del symlink (Quasar deduplicado al del playground); greps de restos Vue 2 limpios; `pnpm check` (Biome) limpio.

> ⚠️ **v0.1.0 es breaking**: requiere Vue 3 nativo (sin `@vue/compat`) y Quasar 2. Apps Vue 2 → quedarse en `0.0.x`.

Historia previa (era `0.0.x`): v0.0.199 `close-drawer` en `HistrixExpansionMenu`, v0.0.198 refactor API de favoritos, hilo de `defineAsyncComponentCompat` (0.0.186→0.0.191), refactor `v-model` compat Vue 2/3 (`5a67280`).

## Cosas saludables

- **Sin build step**: release = bump + tag + push; CI publica source.
- API client (`useApi()`) **centralizado** — toda llamada al backend pasa por ahí.
- Playground real: por primera vez se puede probar la librería sin pisar `node_modules` de un cliente.
- Lint/format unificado con Biome; publicación automatizada por tag (OIDC).
- El paquete publicado quedó limpio: solo `src/` viaja a npm.

## Avance Fase 2 (separar el motor) — 2026-06-08

Se extrajo el motor schema→pantalla a módulos puros testeables en `ui/src/core/`, con **Vitest** montado en la raíz (`pnpm test`). **8 módulos, 119 tests en verde**, build del playground OK, cero cambio de comportamiento (réplicas exactas verificadas + build como red):

| Módulo | Qué | Tests |
|---|---|---|
| `core/formula.js` | evaluador aritmético de `computed_fields` (reemplaza el `eval()` duplicado, sin ejecutar código arbitrario) | 13 |
| `core/keys.js` | `keyFieldNames`/`extractKeys` (claves primarias) | 4 |
| `core/screenType.js` | `resolveScreenKind(type)` (21 `schema.type` → 7 kinds) | 9 |
| `core/fieldType.js` | `resolveFieldKind(fieldSchema)` (`histrix_type`→tipo de input, separado del render) — primer paso del "resolver" que reemplazará el switch de `HistrixField` | 36 |
| `core/options.js` | `mapRemoteOptions`/`mapArrayOptions`/`mapDictOptions` (3 variantes de combos, replicadas fieles) | 23 |
| `core/filters.js` | `buildFilterQuery` (querystring pseudo-OData) | 6 |
| `core/fieldVisibility.js` | `isFieldEditable`/`visibleColumnNames` | 17 |
| `core/dates.js` | `backendDateToDisplay`/`displayDateToBackend`/`dateSortParts` — **desacopla las fechas de Quasar** (reemplaza `date.formatDate`); preserva el workaround de timezone. Tests con `TZ=UTC` | 11 |

> Lección recurrente: las "duplicaciones" del motor NO siempre eran idénticas (`getKeys`, `options`) — se extrajo cada variante fiel, sin unificar a la fuerza.

### `useApi` desacoplado de Quasar

`histrixApi.js` era el único service con Quasar (`Notify` en `downloadAppData`, que además se tragaba el error). Ahora `downloadAppData` **retorna la promesa** y propaga el error; `ExportForm.vue` hace el `.catch` y muestra el `$q.notify` (capa UI correcta). **`services/` quedó 100% libre de Quasar** → `useApi()` es agnóstico de framework.

### Validación end-to-end + bug crítico de v-model (corregido)

Probado v0.1.0 contra backend real: renderiza OK. Eso destapó un bug sistémico de la migración Vue 2→3: los padres se migraron a `@update:model-value` pero los hijos seguían emitiendo `'input'` (Vue 2) → **el camino hijo→padre (edición/grabado) estaba cortado**, solo andaba la lectura. Corregido en **5 componentes** (`HistrixField`, `HistrixForm`, `HistrixTable`, `HistrixCalendar`, `DatabaseSelector` — este último tenía además el prop `value` de Vue 2, migrado a `modelValue`). Auditoría Vue 2 posterior: **librería limpia** de residuos (`$set`/`$on`/`beforeDestroy`/`$listeners`/`.sync`/`filters`/slots viejos: ninguno).

> Lección: tras un drop de Vue 2, grepear `$emit('input'` y props `value:` — el v-model no se migra solo. NO lo cubren los tests (es binding de componente); validar editando+grabando en el playground.

Pendiente de Fase 2: normalización de respuestas (204/HTML §8.9 — agregar manejo, no extraer), unwrap de celdas/`rawData`, construcción de URLs (+ resolver TODO `fixApi` vs `apiUrl`), completar el resolver de `HistrixField` (mover el render kind→componente Quasar), **sistema de notificaciones nativo** (reemplazar los `$q.notify` de los componentes), tests con schemas fixture reales.

## Deuda técnica / cosas que rascan

1. ~~**Sin tests**~~ — **parcial**: Vitest montado + **119 tests** sobre la lógica pura extraída (`core/`). Falta cobertura de componentes (el bug de v-model no lo agarró ningún test) y fixtures de schema reales (Fase 2).
2. ~~**`eval()`**~~ — **resuelto**: extraído a `core/formula.js` (evaluador seguro, sin `eval`), usado por `HistrixForm` y `HistrixTable`.
3. **`config.apiUrl` vs `config.fixApi`** — sigue el TODO en `histrixApi.js -> host()`: decidir la fuente canónica de la URL del backend.
4. **Componentes core importados estática Y dinámicamente** (registrados en `index.js` y lazy-cargados vía `defineLazyComponent`): el code-splitting es no-op para ellos (Vite lo advierte). Decisión arquitectural para Fase 2 (¿el plugin registra todo o solo lo liviano?).
5. **Chunk único de ~1.4 MB** en el build del playground (echarts + quasar + lib). Advisory; mejorable con `manualChunks` cuando importe.
6. **`setup()` híbrido** (Options API + `setup()` solo para inyectar `useApi`/Vuelidate) en ~12 componentes: válido en Vue 3, pero candidato a unificar estilo en Fase 2.
7. **Estado en `localStorage` sin abstracción** (`host`, `database`, `user`, `accessToken` accedidos directo desde 8 componentes).
8. **Sin tipos** — JS puro. Fase 2: JSDoc/`.d.ts` para el contrato del schema.
9. ~~Dos lockfiles/managers conviven~~ — resuelto: **pnpm en todo el repo** (el `npm publish` del CI no usa lockfile).

## Cómo entrarle a un cambio típico

| Querés… | Tocá… |
|---|---|
| Cambiar comportamiento de fetch de schema | `ui/src/services/histrixApi.js` → `getAppSchema` |
| Agregar un tipo de campo nuevo | `ui/src/components/HistrixField.vue` (switch por `histrix_type`) |
| Cambiar render de celda | `ui/src/components/HistrixCell.vue` |
| Tocar el form | `ui/src/components/HistrixForm.vue` (+ Vuelidate en `setup()`) |
| Tocar el menú lateral | `ui/src/components/widgets/HistrixExpansionMenu.vue` o `HistrixMenu.vue` |
| Cambiar export Excel/PDF/CSV | `ui/src/components/ExportForm.vue` + `downloadAppData` en `histrixApi.js` |
| Login/registro | `LoginForm.vue` / `FormLoginNotStyles.vue` + `login`/`register` en `histrixApi.js` |
| Probar local | `cd ui && pnpm install`, luego `cd dev && pnpm install && pnpm dev` (configurar `.env` antes; ver `ui/dev/README.md`) |
| Smoke de compilación | `cd ui/dev && pnpm build` (compila todos los `.vue` de la lib) |
| Publicar nueva versión | bump `ui/package.json`, commit, `git tag v0.1.x && git push --tags` |
