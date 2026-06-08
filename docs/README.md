# histrix-quasar-client — Documentación interna

> Actualizado al **2026-06-08** (rama `main`, paquete `@mundoit-lib/histrix-component-vue` v**0.1.0** — primera versión Vue 3 only).

Esta carpeta es una mini-guía para entrar rápido al proyecto: qué es, cómo está organizado, qué hace cada pieza, y por dónde tocar cuando hay que cambiar algo.

> ⚠️ **`07-backend-histrix.md` NO se versiona** (`.gitignore`): documenta el backend Histrix propietario (endpoints, tablas internas, mapa del código) y el repo es público. Vive solo localmente. El resto de los docs son sobre la **librería** y sí se versionan.

## Índice

- [01 — Resumen del proyecto](01-overview.md)
- [02 — Estructura del repositorio](02-estructura.md)
- [03 — Componentes y widgets](03-componentes.md)
- [04 — Servicios y configuración](04-servicios.md)
- [05 — Build y publicación](05-build-publish.md)
- [06 — Estado actual y notas](06-estado-actual.md)
- [07 — El backend Histrix, explicado para frontenders](07-backend-histrix.md) ← **empezar acá si no conocés Histrix** *(local, no versionado)*
- [08 — Plan de evolución](08-plan-evolucion.md) ← **la decisión estratégica y las fases**

## TL;DR

- Es una **librería de componentes Vue 3 + Quasar 2** pensada para consumir el backend Histrix (XML/JSON schema-driven). Desde v0.1.0 **no soporta Vue 2** (esas apps quedan en `0.0.x`).
- Se publica en npm como `@mundoit-lib/histrix-component-vue` (repo `mundoit-lib/histrix-component-vue`).
- **Consumo source-only**: las apps clientes importan los `.vue` (import raíz, subpath o plugin) y los **compila el bundler de la app**. Solo se publica `ui/src/` (`files: ["src"]`); no hay build step.
- La superficie pública son ~28 componentes / widgets declarados como subpaths en `ui/package.json -> exports` y re-exportados desde `ui/src/index.js` (que también provee `install()` para `app.use`).
- El **dev playground** vive en `ui/dev/`: Vite + Quasar 2, consume la librería vía `link:..` (symlink vivo) y permite abrir cualquier XML contra un backend real (`pnpm dev` adentro de `ui/dev/`). Todo el repo usa **pnpm**.
- Lint/format unificado con **Biome** (`pnpm check` / `pnpm lint` en la raíz).
- Publicación automática en npm vía GitHub Actions cuando se pushea un tag `v*` (ver `.github/workflows/publish.yml`).
- El rumbo del proyecto (por qué Vue 3 + Quasar 2 y no React/shadcn, fases de refactor) está en [08-plan-evolucion.md](08-plan-evolucion.md).
