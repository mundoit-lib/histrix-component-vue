# 01 — Resumen del proyecto

## Qué es

`histrix-quasar-client` es la **librería de componentes Vue** de Mundo IT que actúa como **cliente UI del backend Histrix**. Histrix es un motor de aplicaciones declarativas: las pantallas (formularios, tablas, calendarios, dashboards, etc.) se describen con un *schema* XML/JSON servido por el backend, y esta librería renderiza ese schema en componentes Quasar listos para usar.

El paquete publicado se llama **`@mundoit-lib/histrix-component-vue`** (no confundir con el nombre del repo).

> **Desde v0.1.0 la librería es Vue 3 + Quasar 2 únicamente** (sin `vue-demi`, sin `@vue/compat`). Las apps Vue 2 quedan en la serie `0.0.x`. Decisión y plan en [`08-plan-evolucion.md`](08-plan-evolucion.md).

### Modelo de consumo: source-only

A diferencia de una librería npm "tradicional", **acá no se publica código compilado**. Lo que viaja en el tarball de npm es `ui/src/` con los `.vue` originales (`files: ["src"]` en `ui/package.json`). Cada app cliente importa los componentes (import raíz, subpath o plugin — ver `ui/package.json -> exports`) y los **compila su propio bundler** (Vite / Quasar CLI / webpack).

Consecuencias prácticas:

- **No hay build step en el flujo de release**. Bumpear `ui/package.json -> version`, tag, push, y CI publica directo el código fuente.
- Cambios en `.vue` son visibles para clientes apenas hacen `npm update` y rebuild de su app — no hay paso intermedio.
- No se pueden usar features que requieran transformación a build-time específica (ej. tipos `.d.ts` generados) salvo que el cliente ya los soporte.

## Para qué se usa

Una app concreta de Histrix (típicamente un proyecto Vite o Quasar CLI propio del cliente) hace:

```js
import { HistrixApp, HistrixForm, HistrixTable } from '@mundoit-lib/histrix-component-vue';
// o registra todo:  app.use(HistrixPlugin)  desde '@mundoit-lib/histrix-component-vue/plugin'
```

…y arma su UI orquestando estos componentes. Toda la lógica de **fetch de schema**, **submit de formularios**, **export PDF/Excel/CSV**, **favoritos**, **menú**, **login con OAuth password grant**, **upload de archivos**, etc., ya está adentro de la librería.

## Stack

| Pieza | Versión / Detalle |
|---|---|
| Vue | `^3.2.0` (peer) |
| Quasar | `^2.0.0` (peer) |
| Validaciones | `@vuelidate/core` + `@vuelidate/validators` (peer) |
| HTTP | `@mundoit-lib/plugin-vue-axios` (peer) |
| Auth | `@mundoit-lib/plugin-vue-auth` (peer) |
| Charts | `echarts ^5.6.0` + `vue-echarts ^7.0.3` |
| Calendar | `@quasar/quasar-ui-qcalendar ^3.4.1` |
| Lint/format | Biome 1.9.4 (CRLF, single-quote, 120 cols, sin trailing commas) |
| Package manager raíz | pnpm 10.33.0 |
| Package manager `ui/` y `ui/dev/` | npm |
| Playground | Vite + `@quasar/vite-plugin` en `ui/dev/` |
| CI | GitHub Actions → publica a npm en tags `v*` |

## Contexto Histrix

Para entender los nombres, pensar en este modelo mental:

- El backend Histrix expone endpoints REST sobre una base de datos (multi-DB: la DB activa vive en `localStorage.database`).
- Endpoints clave: `GET /api/db/{db}/schema/{path}`, `GET|POST|PUT|PATCH|DELETE /api/db/{db}/app/{path}`, `/menu/{level}`, `/me`, `/token`, `/favorites/`, `/files/{path}`, `/export/{formato}/{path}`, `/pdf/{path}`, `/thumb/{path}`.
- El componente raíz típico es `<HistrixApp :path="…" :query="…" />` que pide el schema y, según `schema.type`, instancia internamente `HistrixForm`, `HistrixTable`, `HistrixCalendar`, `HistrixDashboard`, `HistrixList`, `HistrixTree`, `HistrixChart`, etc.

Ver `04-servicios.md` para el detalle del API client y `07-backend-histrix.md` para el contrato completo con el backend.
