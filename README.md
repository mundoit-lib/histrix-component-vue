# histrix-quasar-client

Librería de componentes **Vue 3** para construir clientes del backend **Histrix** sobre **Quasar 2**. Se publica en npm como [`@mundoit-lib/histrix-component-vue`](https://www.npmjs.com/package/@mundoit-lib/histrix-component-vue).

[![npm](https://img.shields.io/npm/v/@mundoit-lib/histrix-component-vue.svg?label=@mundoit-lib/histrix-component-vue)](https://www.npmjs.com/package/@mundoit-lib/histrix-component-vue)

> **Desde v0.1.0 la librería es Vue 3 + Quasar 2 únicamente** (sin `@vue/compat`). Las apps Vue 2 deben quedarse en la serie `0.0.x`. La decisión y el plan de evolución están en [`docs/08-plan-evolucion.md`](./docs/08-plan-evolucion.md).

## Cómo se consume

**Distribución source-only**: el paquete publicado contiene los `.vue` sin compilar (`ui/src/`). Cada app cliente los importa y los compila con su propio bundler (Vite / Quasar CLI / webpack).

```js
// Import raíz (named exports):
import { HistrixApp, HistrixTable } from '@mundoit-lib/histrix-component-vue';

// Por subpath:
import HistrixTable from '@mundoit-lib/histrix-component-vue/components/HistrixTable';

// Plugin (registra todos los componentes globalmente):
import HistrixPlugin from '@mundoit-lib/histrix-component-vue/plugin';
app.use(HistrixPlugin);
```

Subpaths disponibles en [`ui/package.json` → `exports`](./ui/package.json). Peers requeridos: `vue ^3.2`, `quasar ^2`, `@vuelidate/core` + `@vuelidate/validators`, `@mundoit-lib/plugin-vue-axios`, `@mundoit-lib/plugin-vue-auth`.

## Estructura del repo

```
ui/        Paquete publicable (@mundoit-lib/histrix-component-vue)
  src/     ← código fuente (esto es lo que viaja en npm)
  dev/     Playground Vite + Vue 3 + Quasar 2 (no se publica)
docs/      Documentación interna del proyecto
```

Ver [`docs/`](./docs/README.md) para la guía completa: estructura, componentes, servicios, publicación, estado actual y plan de evolución. Si no conocés Histrix, empezá por [`docs/07-backend-histrix.md`](./docs/07-backend-histrix.md).

## Flujo de release

No hay paso de build. La publicación es automática en CI cuando se tagea:

```bash
# 1. Bumpear versión
$ vim ui/package.json   # version: "0.1.x" → "0.1.x+1"

# 2. Commit + tag
$ git commit -am "Actualizar versión a 0.1.x"
$ git tag v0.1.x
$ git push && git push --tags
```

GitHub Actions (`.github/workflows/publish.yml`) corre `npm publish` desde `ui/` con OIDC. Con `files: ["src"]` solo se publica el código fuente.

## Desarrollo local

```bash
# Deps de la librería (una vez):
$ cd ui && pnpm install

# Playground (Vite + Quasar 2) — configurar ui/dev/.env primero
$ cd ui/dev
$ pnpm install
$ pnpm dev

# Lint + format (Biome) desde la raíz
$ pnpm check
```

El playground consume la librería local vía `link:..` (symlink vivo con HMR, respetando los `exports` reales del paquete) y permite abrir cualquier XML de Histrix contra un backend real. Ver [`ui/dev/README.md`](./ui/dev/README.md).

## Licencia

MIT © Luis M. Melgratti — <luis@mundoit.com.ar>
