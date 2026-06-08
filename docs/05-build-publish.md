# 05 — Publicación y desarrollo

## Cómo se consume

Esta librería **se distribuye como código fuente**. El tarball de npm contiene `ui/src/` con los `.vue` sin compilar (`files: ["src"]` en `ui/package.json`); las apps clientes los importan y **su propio bundler los compila** (Vue 3 + Quasar 2).

Entradas del paquete:

| Import | Resuelve a | Para qué |
|---|---|---|
| `@mundoit-lib/histrix-component-vue` | `src/index.esm.js` | Named exports + default plugin |
| `…/plugin` | `src/index.js` | Plugin con `install(app)` que registra todo globalmente |
| `…/components/X` | `src/components/X.vue` | Import directo de un componente |
| `…/components/widgets/X` | `src/components/widgets/X.vue` | Import directo de un widget |
| `…/services/{histrixApi,config,histrix-bearer}` | `src/services/*.js` | API client, config runtime, driver auth |

> Hasta v0.0.199 los campos `main`/`module` apuntaban a un `dist/` que nunca se publicó (el import raíz fallaba). Desde v0.1.0 apuntan a `src/index.esm.js` y el import raíz funciona.

**No hay build step.** El pipeline Rollup legacy que vivía en `ui/build/` (ESM/CJS/UMD + CSS) se eliminó en la Fase 1 del plan de evolución; si alguna vez hace falta un bundle standalone, está en el historial de git (hasta `v0.0.199`).

## Versionado y publicación

1. Bumpear `ui/package.json -> version` a mano.
2. Commit: `Actualizar versión a 0.1.x; <cambios>`.
3. `git tag v0.1.x && git push --tags` ← esto dispara CI.
4. `.github/workflows/publish.yml` corre `npm publish` desde `ui/` con Node 24 y registry `https://registry.npmjs.org` (auth por OIDC: el workflow declara `id-token: write`).

Reglas de versionado acordadas:

- **`0.0.x`** — serie legacy Vue 2/Vue 3 vía `vue-demi`. Congelada; solo hotfixes críticos para apps Vue 2.
- **`0.1.x`** — Vue 3 + Quasar 2 nativo (actual).

### Hardening pendiente (opcional)

No hay `provenance: true` ni `--access public` explícito en el `npm publish`. Si en algún momento se quiere endurecer el supply chain, agregar `npm publish --provenance --access public` al workflow.

## Desarrollo local: el playground

`ui/dev/` es una app **Vite + Vue 3 + Quasar 2** que consume la librería local vía `link:..` (symlink vivo: editar `ui/src` se refleja con HMR) respetando los `exports` reales del paquete, igual que una app cliente. Reemplaza el flujo viejo de "probar pisando `node_modules` de un cliente".

```bash
cd ui && pnpm install   # deps de la librería (link: no las instala solo)
cd dev
pnpm install
cp .env.example .env    # host del backend, db, client_id/secret
pnpm dev
```

Funciones: login contra un backend Histrix real, y una ruta catch-all `/app/<path-del-xml>` que monta `<HistrixApp>` con cualquier pantalla. Detalle en `ui/dev/README.md`.

`pnpm build` dentro de `ui/dev/` compila **todos** los `.vue` de la librería con Vue 3 + Quasar 2 reales — es el smoke test de compilación más barato que tenemos (sin tests todavía; ver Fase 2 en `08-plan-evolucion.md`).

> El `npm publish` del CI no cambia: publicar no usa lockfile ni node_modules.

## Lint y format

En la raíz:
```
pnpm check   # biome check --write --unsafe (lint + format + organize imports)
pnpm lint    # biome lint --write
```

Reglas Biome relevantes (`biome.json`):
- Indent 2 espacios, line width 120, **CRLF**, comillas simples, sin trailing commas, sin punto y coma opcional.
- `noUndeclaredVariables: error`, `noUnusedVariables: error` (correctness).
- `noNamespace: error` (style), `noEmptyBlockStatements: error` (suspicious).
- `useSortedClasses` (nursery, warn) sobre `class`/`className` y helpers `cn|cx|clsx`.
- Usa `.gitignore` como `useIgnoreFile`.
