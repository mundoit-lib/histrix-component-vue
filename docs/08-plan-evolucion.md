# 08 — Plan de evolución

> Decisión estratégica tomada el **2026-06-05**. Este doc registra el qué, el porqué y el plan por fases, para no re-litigar la discusión cada seis meses.

## La decisión

**El proyecto sigue en Vue 3.** Se elimina todo el soporte Vue 2, se sanea la infraestructura, y se refactoriza separando el motor Histrix de la capa visual. **React queda descartado.** Quasar 2 se mantiene **como punto de partida**, pero la dirección de fondo es **salir de Quasar progresivamente hacia componentes nativos + UnoCSS** (ver Fase 3): no por shadcn-vue, sino con componentes propios. La salida es incremental (strangler), no una reescritura big-bang.

> Matiz vs. la versión original de este doc: la decisión inicial era "quedarse en Quasar, shadcn diferido quizás para siempre". El **2026-06-08** el equipo clarificó que el rumbo real es dejar Quasar de a poco (su diseño no convence; las apps ya usan UnoCSS). No cambia el "no React" ni el "no big-bang"; sí define el destino de la capa visual. Primer paso ya dado: `HistrixLoginSplit` (componente nativo).

### Contexto al momento de decidir

- La librería la consumen pocos clientes, todos en Vue 3. Los 2-4 clientes que quedan en Vue 2 usan **otra** librería antigua, no esta.
- ~8.900 líneas, 28 componentes. El core real son 4 archivos (`HistrixApp`, `HistrixField`, `HistrixTable`, `HistrixForm`) ≈ 4.000 líneas.
- Acoplamiento Quasar: 414 tags `q-*` en 26/28 archivos; profundo en el core (QTable, QSelect, QDate/QTime, QFile, QEditor, QSplitter).
- Sin tests, sin playground funcional (`ui/dev/` no existía), build muerto, `main`/`module` del package.json apuntaban a un `dist/` que nunca se publicó.
- El objetivo del producto: **Backend-Driven UI para la gran mayoría de las pantallas** + libertad de hacer cosas a mano en Vue. Tiene que funcionar bien en celular. Se pueden pedir cambios en la API del backend.

### Por qué NO React / react-admin

1. **react-admin no regala el motor.** Es *code-driven* (recursos y pantallas declarados en JSX); Histrix es *schema-driven* (el servidor manda la pantalla). El trabajo duro — interpretar el schema, los `histrix_type`, helpers popup, campos dependientes, instancias en sesión PHP — habría que reescribirlo igual, peleando contra el framework.
2. Se pierde la "libertad de hacer cosas a mano": las partes custom de las apps cliente están en Vue.
3. Todo el conocimiento de las trampas del contrato (ver `07-backend-histrix.md` §8: `options_sorted`, fechas `dd/mm/yyyy`, `NULL≠0`, `preFetch`, errores HTML, multi-tenant) ya está pagado y codificado acá.
4. No existe una razón de negocio que justifique obligar a los clientes actuales a migrar.

**Criterio para revisitar:** solo si aparece una razón de negocio externa (equipo React contratado, cliente grande que lo exige). No por moda.

### Por qué NO shadcn-vue (por ahora)

1. Esto es una **librería npm consumida por terceros**, no una app. El modelo shadcn (vendorizar componentes + Tailwind) arrastraría Tailwind como requisito a todas las apps cliente.
2. Migración "de a poco" = dos design systems conviviendo en cada app cliente (Quasar + Tailwind): doble peso, conflictos de estilos, UI inconsistente. En una librería compartida, el estado intermedio es peor que ambos extremos.
3. Lo que Quasar regala no tiene equivalente directo: QTable server-side (corazón de `HistrixTable`), QEditor, QDate/QTime, QFile, QCalendar. Reemplazar todo = ~80% del costo de una reescritura.
4. Para el requisito mobile, Quasar juega a favor (componentes touch-ready, `$q.screen`, Capacitor disponible).
5. Si el motivo es estético: Quasar 2 se tematiza a fondo con CSS vars. Tematizar es mucho más barato que reescribir renderers.

**Criterio para revisitar:** después de la Fase 2 (motor separado de la piel), si se quiere identidad visual propia y hay tiempo. En ese escenario, para un ERP el candidato natural es más **PrimeVue** (DataTable potente) que shadcn-vue. Con el core separado, cambiar la piel es un proyecto acotado, no una reescritura.

---

## Las fases

### Fase 1 — Sanear ✅ (ejecutada 2026-06-05)

Drop de Vue 2 + limpieza + infraestructura mínima:

- **Vue 3 only**: fuera `vue-demi`, `isVue2/isVue3`, `defineAsyncComponentCompat` (→ `defineLazyComponent`), sintaxis `.sync` (→ `v-model:prop`), peer de `@vue/composition-api`, `vue ^2.6.11` en dependencies.
- **package.json saneado** (v0.1.0, breaking): `main`/`module`/`exports["."]` apuntan a `src/index.esm.js` (real); `files: ["src"]` (el paquete ya no publica basura); `quasar ^2.0.0` y `vue ^3.2.0` como peerDependencies explícitas; fuera `vue-picture-input` (muerta), `browserslist` y todas las devDeps del build muerto.
- **Borrado**: `ui/build/` (pipeline Rollup legacy), `index.common.js`, `index.umd.js`, `index.sass`, `umd-test.html`.
- **`index.js`**: `install(app)` Vue 3, registro genérico iterando lista, se registran los que faltaban (`HistrixConnectionSettings`, `HistrixFileManager`, `InputPassword`), se exporta `config`.
- **Bugs de registro**: `HistrixTree` ya no se llama `'HistrixTable'` (pisaba el registro global de la tabla real); typo `HistrixConectionSettings` corregido.
- **Limpieza**: ~21 `console.log` de debug eliminados (catches → `console.error`), ~100 líneas de código comentado muerto eliminadas, `histrix-bearer.js` reducido al driver mínimo funcional.
- **Lazy-load real**: los call-sites pasaban `import(...)` ya disparado; ahora `() => import(...)` — los chunks se cargan al usarse, no al montar.
- **Playground nuevo** en `ui/dev/`: Vite + Vue 3 + Quasar 2, consume la librería vía `file:..` (los `exports` reales del paquete), login contra backend real, ruta catch-all que monta `HistrixApp` con cualquier path de XML. Reemplaza el flujo "probar pisando node_modules de un cliente".
- **Verificación**: `vite build` del playground compila todos los `.vue` de la librería con Vue 3 + Quasar 2 reales.

> ⚠️ **Breaking (v0.1.0)**: requiere Vue 3 nativo (sin `@vue/compat`) y Quasar 2. Apps Vue 2: quedarse en `0.0.x`.

### Fase 2 — Separar motor de piel (pendiente)

El activo del proyecto es el motor schema→pantalla, no la UI. Hoy están amasados en archivos de 1.300 líneas.

- Extraer el **schema engine** (interpretación de `schema.type`, `histrix_type`, `update_fields`, instancias, `useApi`) a módulos sin UI.
- `HistrixField` pasa de switch gigante a un **resolver** que delega en renderers chicos (un archivo por tipo de campo).
- **Tests** contra schemas fixture capturados de la API real (varios clientes/bases, multi-tenant). Sin esto, cualquier evolución es a ciegas.
- Sacar el `eval()` de `processOperation` (parser aritmético chico o `Function` con whitelist).
- Resolver el TODO de `config.fixApi` vs `config.apiUrl` (fuente canónica de la URL del backend).
- Tipos: JSDoc/`.d.ts` para el contrato del schema (el "tipo Schema" documentado en `07-backend-histrix.md` §5).

### Fase 3 — Salida progresiva de Quasar → nativo + UnoCSS (en curso)

> **Dirección clarificada (2026-06-08).** El objetivo de fondo es **dejar de depender de Quasar** y de su diseño (que no convence al equipo). El stack de las apps de Mundo IT ya es UnoCSS. El rumbo de esta librería acompaña eso: ir reemplazando los componentes Quasar por **componentes nativos** (HTML + CSS scoped propio), customizables, que no hereden estilos de Quasar.

**Estrategia: strangler (de afuera hacia adentro), no big-bang.** No se reescribe todo de golpe — se reemplaza pieza por pieza, empezando por lo barato:

1. **Componentes simples primero** (login, cambio de password, connection settings, menús, news): son HTML + lógica, migrables a nativo + CSS scoped sin costo alto. **Ya empezó: la familia de auth nativa `htx-auth`** — `HistrixLoginSplit` (primero), más `HistrixRegisterSplit`, `HistrixForgotPasswordSplit` y `HistrixResetPasswordSplit` (agregados el 2026-06-08, mismo diseño split). Comparten `utils/color.js` y, opcionalmente, el select de DB (`show-database`) que persiste la base elegida en `config.db`+`localStorage` (ver `03-componentes.md`).
2. **Motor pesado al final** (HistrixTable, HistrixField, HistrixForm, HistrixApp): dependen de QTable/QSelect/QDate/QEditor, que son lo caro de reemplazar. Quedan en Quasar hasta tener el motor separado (Fase 2) y un reemplazo headless elegido (TanStack Table, datepickers, TipTap…).

**Principios para componentes nativos nuevos:**

- **CSS scoped propio, autónomo.** Que se vean perfecto en cualquier app sin requerir que el cliente configure su UnoCSS para escanear `node_modules`. Lo cosmético no depende de utilities externas.
- **Customización por props + slots.** Color, logo, imágenes, textos por props (vía `:style`/CSS vars, no clases fijas). Slots para layout custom (donde el cliente sí usa su UnoCSS).
- **Lógica desacoplada de la UI.** Usar los servicios puros (`useApi()`), no envolver componentes Quasar.
- **UnoCSS NO como peer de la librería** (sigue valiendo lo de la decisión original): la librería se ve bien sola; UnoCSS vive en las apps y en los slots.

Estado intermedio asumido: durante la transición la librería usa **Quasar (motor) + componentes nativos (lo migrado)** conviviendo. Es esperado.

### Mejoras de API backend (paralelo, alto ROI)

Ya que el backend acepta cambios — pedir:

1. **Errores del process siempre JSON** (hoy a veces llegan como fragmento HTML con status 400 — `07-backend-histrix.md` §8.9).
2. **Formalizar el contrato del schema** (JSON Schema/OpenAPI versionado). Abarata este front y cualquier front futuro.
3. Documentar la API de instancias (`/instance/{id}`, expiración, serialización de sesión).
