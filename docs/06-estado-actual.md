# 06 — Estado actual y notas

> Snapshot al **2026-10-01**, `main` (`6501433`), paquete v**0.1.2** publicado en npm. Fuente de los números: la auditoría del 2026-09-30 (`09-auditoria-2026-09-30.md`, local).

## Fotografía (2026-10-01)

| Métrica | Valor |
|---|---|
| Versión publicada en npm | 0.1.2 (`v0.1.0`, `v0.1.1`, `v0.1.2` en jun/jul 2026) |
| Commits sin publicar | `0cb74fe` (ayudas stateless, 07-03) y `6501433` (condiciones, `data-formulas`, paginación desde el schema) |
| Componentes `.vue` | **34** (21 top-level + 13 widgets) |
| Registrados por `install()` | 33 (falta `HistrixHelp`) |
| Subpaths de componentes en `exports` | 32 (faltan `HistrixHelp` y `HistrixMenuSearch`) |
| Módulos puros `core/` | **15** (+15 archivos de test) |
| Tests | **15 archivos, 203 tests, 0 fallos** (Vitest) |
| Biome (`npx biome check ui/src`, 2026-09-30) | 18 errores (11 de formato CRLF, 7 de lint) |
| Líneas `ui/src` (components + core + services) | ~13.100 |
| Los 4 core | `HistrixTable` ~1.470 · `HistrixField` ~1.100 · `HistrixForm` ~800 · `HistrixApp` ~780 |
| `eval` / `new Function` | 0 |

Consumidores en Vue 3 (`@mundoit-lib/histrix-component-vue`): tork-frontend (0.1.2), angel-alvarez-frontend (0.1.0), rodamar, transcaden y prosilo (0.0.19x, ya en Vue 3.5 + Quasar 2: pueden subir a 0.1.x sin migrar framework). Los clientes Quasar 1 siguen en las librerías viejas.

## Junio–octubre 2026, por commit

| Fecha | Commit | Qué agregó |
|---|---|---|
| 06-09 | `d1cad32` | **Filtros con auto-búsqueda**: `schema.auto_filter === true` dispara `filter-data` en cada cambio y oculta el botón Buscar (`HistrixFilters`). |
| 06-09 | `c32e9af` | **`HistrixMenuSearch`**: typeahead sobre el árbol del menú, teclado, Ctrl/⌘+K, `emits: ['navigate']`. Registrado en `index.js`, sin subpath en `exports`. |
| 06-09 | `bac7461` | Refactor visual de "featured" en `HistrixExpansionMenu`. |
| 06-26 | `bee0f49` | **Renglones de grilla**: `HistrixForm.isGridRow` (`ing/grid/liveGrid`) emite `insert-row` en vez de POST; `HistrixTable.commitGridRow` acumula la fila cliente-side; autoselección de combo con una sola opción. |
| 06-26 | `19af379` | **Validación diferida + foco al primer error**: `HistrixForm.validateAndFocus()` (lo usa `HistrixApp` antes de procesar/avanzar); Grabar ya no se deshabilita por `$invalid`; flag `processing` anti doble submit. |
| 06-26 | `50b301f` | **Vista móvil de tabla** (<600 px: tarjetas `histrix-grid-card`) y **layout de filtros** (uno en línea vs. `q-expansion-item` con grilla). |
| 06-30 | `c5a42b9` | **Export reescrito**: `core/export.js` (+27 tests), formatos `xls/pdf/csv/xml` con delimitador para CSV, `ExportForm` nuevo, barra de paginación rediseñada. |
| 07-03 | `0cb74fe` | **Ayudas stateless**: `HistrixHelp` (picker con `__help`, `context_fields`, `term`, relleno desde `data-helpdetail`); **botones de acción en fichaing** (`helpers.link` no editables → `q-btn` que abre el XML); **respeto de `preFetch: false`** (`autoFetchAllowed`); módulos `core/icons`, `links`, `schemaUri`, `values`. |
| 10-01 | `6501433` | **Condiciones y `data-formulas`**: `core/condition.js` (tokenizer + shunting-yard, sin `eval`) y `core/dataFormulas.js` → `visibleWhen/requiredWhen/enabledWhen` en `HistrixField` (`isVisible`, `required`, `isDisabled`); **paginación desde `schema.pagination`** en `HistrixTable`; `form_style` en `HistrixForm`. |


## Fase 1 del plan de evolución (2026-06-05)

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

## Avance Fase 2 (separar el motor) — desde 2026-06-08

Se extrajo el motor schema→pantalla a módulos puros testeables en `ui/src/core/`, con **Vitest** montado en la raíz (`pnpm test`). Arrancó el 2026-06-08 con 8 módulos y 119 tests (réplicas exactas, cero cambio de comportamiento); al 2026-10-01 son **15 módulos y 203 tests**:

| Módulo | Qué | Tests |
|---|---|---|
| `core/formula.js` | evaluador de `computed_fields`/`jseval` sin `eval`; **hoy sólo aritmética** (`+ - * /` y paréntesis): ver la corrección en `08-plan-evolucion.md` y HD-7523 | 13 |
| `core/keys.js` | `keyFieldNames`/`extractKeys` (claves primarias) | 4 |
| `core/screenType.js` | `resolveScreenKind(type)` (21 `schema.type` → 7 kinds) | 9 |
| `core/fieldType.js` | `resolveFieldKind(fieldSchema)` (`histrix_type`→tipo de input, separado del render) — primer paso del "resolver" que reemplazará el switch de `HistrixField` | 36 |
| `core/options.js` | `mapRemoteOptions`/`mapArrayOptions`/`mapDictOptions` (3 variantes de combos, replicadas fieles) | 23 |
| `core/filters.js` | `buildFilterQuery` (querystring pseudo-OData) | 6 |
| `core/fieldVisibility.js` | `isFieldEditable`/`visibleColumnNames` | 17 |
| `core/dates.js` | `backendDateToDisplay`/`displayDateToBackend`/`dateSortParts` — **desacopla las fechas de Quasar** (reemplaza `date.formatDate`); preserva el workaround de timezone. Tests con `TZ=UTC` | 11 |
| `core/export.js` | formatos de export, parámetros (`_delimiter`), nombre de archivo y URL (ver `04-servicios.md`) | 27 |
| `core/icons.js` | `mapUiIcon`: íconos jQuery-UI (`ui-icon-*`) de Histrix → Material Icons | 4 |
| `core/links.js` | `resolveHelperLinkPath`/`buildLinkParameters`: destino de un `helpers.link` (con o sin `dir`) | 12 |
| `core/schemaUri.js` | `parseSchemaUri`/`joinDirXml`/`parseHelpDetail`: `uri` del schema → `{path, params}` y `data-helpdetail` | 12 |
| `core/values.js` | `compactValues`/`pick`/`omit` sobre valores de form/fila (conserva `0`, `'0'`, `false`) | 14 |
| `core/condition.js` | `evaluateCondition(formula, getValue)`: comparaciones, `&& \|\| and or`, aritmética y paréntesis, sin `eval`; sintaxis inválida → `false` | 7 |
| `core/dataFormulas.js` | `parseDataFormulas`/`computeFormulaFlags`: `data-formulas` → `{required, visible, enabled}` (`__REQUIRED` OR, `__VISIBLE`/`__ENABLED` AND) | 8 |

> Lección recurrente: las "duplicaciones" del motor NO siempre eran idénticas (`getKeys`, `options`) — se extrajo cada variante fiel, sin unificar a la fuerza.

### `useApi` desacoplado de Quasar

`histrixApi.js` era el único service con Quasar (`Notify` en `downloadAppData`, que además se tragaba el error). Ahora `downloadAppData` **retorna la promesa** y propaga el error; `ExportForm.vue` hace el `.catch` y muestra el `$q.notify` (capa UI correcta). **`services/` quedó 100% libre de Quasar** → `useApi()` es agnóstico de framework.

### Validación end-to-end + bug crítico de v-model (corregido)

Probado v0.1.0 contra backend real: renderiza OK. Eso destapó un bug sistémico de la migración Vue 2→3: los padres se migraron a `@update:model-value` pero los hijos seguían emitiendo `'input'` (Vue 2) → **el camino hijo→padre (edición/grabado) estaba cortado**, solo andaba la lectura. Corregido en **5 componentes** (`HistrixField`, `HistrixForm`, `HistrixTable`, `HistrixCalendar`, `DatabaseSelector` — este último tenía además el prop `value` de Vue 2, migrado a `modelValue`). Auditoría Vue 2 posterior: **librería limpia** de residuos (`$set`/`$on`/`beforeDestroy`/`$listeners`/`.sync`/`filters`/slots viejos: ninguno).

> Lección: tras un drop de Vue 2, grepear `$emit('input'` y props `value:` — el v-model no se migra solo. NO lo cubren los tests (es binding de componente); validar editando+grabando en el playground.

## Pendiente: subtareas de HD-7515 (cliente stateless, post-auditoría)

| Clave | Qué |
|---|---|
| HD-7517 | Release 0.1.3: superficie pública (registro y subpaths de `HistrixHelp`/`HistrixMenuSearch`), `emits`, peers y lint |
| HD-7518 | Capa de contrato: normalizar `type`/`histrix_type`, fallback visible, borrar `TipoDato`, payload sin `isExpression` |
| HD-7519 | Renderer numérico: `Numeric`/`Decimal`/`CustomNumeric`/`Enclosed*` con máscara, precisión y validación |
| HD-7520 | Errores de API y notificaciones (servicios): `HistrixApiError`, interceptor en `useApi`, notify inyectable |
| HD-7521 | Errores y notificaciones en componentes: proceso que no cierra en error, update visible, 204, sin `alert`/`confirm` |
| HD-7522 | Fixtures reales de schema y tipos (`schema.d.ts` + JSDoc) para el core |
| HD-7523 | Fórmulas reales en `core/formula.js`: funciones con whitelist, condicionales, `__EVAL` y medición sobre los `jseval` reales |
| HD-7524 | Tabla: paginación server-side, totales al pie y campos dependientes en grilla |
| HD-7525 | Atajos de teclado y foco: F9 procesar, Esc cerrar, F2 ayuda, Enter siguiente campo, foco inicial, Ctrl+K |
| HD-7526 | Higiene de integración: sin `$events`/`$router`, `HistrixPage`, `HistrixAppDialog`, `useHistrixSession`, `useApi` sin `localStorage` |
| HD-7527 | Calendario: pedir eventos por rango visible (`start`/`end`) |
| HD-7528 | Docs al día + ADR "cliente stateless, sin instancias" (este cambio) |
| HD-7529 | Grilla ING completa: editar/borrar renglón confirmado, totales, teclado, liveGrid con guardado por fila |
| HD-7530 | i18n mínimo: `provide/inject` `histrixI18n` con diccionario es |

La decisión de arquitectura que encuadra estas subtareas está en el ADR de [`08-plan-evolucion.md`](08-plan-evolucion.md#adr-2026-10-01--cliente-stateless-sin-instancias).

## Deuda técnica / cosas que rascan

1. ~~**Sin tests**~~ — **parcial**: Vitest + **203 tests** sobre la lógica pura (`core/`). Falta cobertura de componentes (el bug de v-model no lo agarró ningún test) y fixtures de schema reales (HD-7522).
2. ~~**`eval()`**~~ — **resuelto**: extraído a `core/formula.js` (evaluador seguro, sin `eval`), usado por `HistrixForm` y `HistrixTable`. Pero sólo cubre aritmética y los `jseval` reales usan funciones (`toFixed`, `substring`, `Date.parse`…): ampliarlo es HD-7523.
3. **`config.apiUrl` vs `config.fixApi`** — sigue el TODO en `histrixApi.js -> host()`: decidir la fuente canónica de la URL del backend.
4. **Componentes core importados estática Y dinámicamente** (registrados en `index.js` y lazy-cargados vía `defineLazyComponent`): el code-splitting es no-op para ellos (Vite lo advierte). Decisión arquitectural para Fase 2 (¿el plugin registra todo o solo lo liviano?).
5. **Chunk único de ~1.4 MB** en el build del playground (echarts + quasar + lib). Advisory; mejorable con `manualChunks` cuando importe.
6. **`setup()` híbrido** (Options API + `setup()` solo para inyectar `useApi`/Vuelidate) en ~12 componentes: válido en Vue 3, pero candidato a unificar estilo en Fase 2.
7. **Estado en `localStorage` sin abstracción** (`host`, `database`, `user`, `accessToken`: ~20 accesos directos en 12 archivos). HD-7526.
8. **Sin tipos** — JS puro. JSDoc/`.d.ts` para el contrato del schema: HD-7522.
9. ~~Dos lockfiles/managers conviven~~ — resuelto: **pnpm en todo el repo** (el `npm publish` del CI no usa lockfile).

## Cómo entrarle a un cambio típico

| Querés… | Tocá… |
|---|---|
| Cambiar comportamiento de fetch de schema | `ui/src/services/histrixApi.js` → `getAppSchema` |
| Agregar un tipo de campo nuevo | `ui/src/core/fieldType.js` (resolver) + `ui/src/components/HistrixField.vue` (render) |
| Condiciones de visibilidad/obligatoriedad | `ui/src/core/condition.js` + `core/dataFormulas.js` (`data-formulas`) |
| Ayudas (picker) | `ui/src/components/HistrixHelp.vue` (+ `core/schemaUri.js`, `core/values.js`) |
| Cambiar render de celda | `ui/src/components/HistrixCell.vue` |
| Tocar el form | `ui/src/components/HistrixForm.vue` (+ Vuelidate en `setup()`) |
| Tocar el menú lateral | `ui/src/components/widgets/HistrixExpansionMenu.vue` o `HistrixMenu.vue` |
| Cambiar export Excel/PDF/CSV/XML | `ui/src/core/export.js` (formatos, parámetros) + `ExportForm.vue` + `downloadAppData` en `histrixApi.js` |
| Login/registro | `LoginForm.vue` / `FormLoginNotStyles.vue` + `login`/`register` en `histrixApi.js` |
| Probar local | `cd ui && pnpm install`, luego `cd dev && pnpm install && pnpm dev` (configurar `.env` antes; ver `ui/dev/README.md`) |
| Smoke de compilación | `cd ui/dev && pnpm build` (compila todos los `.vue` de la lib) |
| Publicar nueva versión | bump `ui/package.json`, commit, `git tag v0.1.x && git push --tags` |
