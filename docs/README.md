# histrix-quasar-client — Documentación interna

> Actualizado al **2026-10-01** (rama `main`, paquete `@mundoit-lib/histrix-component-vue` v**0.1.2**; Vue 3 only desde v0.1.0).

Esta carpeta es una mini-guía para entrar rápido al proyecto: qué es, cómo está organizado, qué hace cada pieza, y por dónde tocar cuando hay que cambiar algo.

> ⚠️ **`07-backend-histrix.md` y `09-auditoria-2026-09-30.md` NO se versionan** (`.gitignore`): documentan el backend Histrix propietario (endpoints, tablas internas, mapa del código) y el repo es público. Viven solo localmente. El resto de los docs son sobre la **librería** y sí se versionan.

## Índice

- [01 — Resumen del proyecto](01-overview.md)
- [02 — Estructura del repositorio](02-estructura.md)
- [03 — Componentes y widgets](03-componentes.md)
- [04 — Servicios y configuración](04-servicios.md)
- [05 — Build y publicación](05-build-publish.md)
- [06 — Estado actual y notas](06-estado-actual.md)
- [07 — El backend Histrix, explicado para frontenders](07-backend-histrix.md) ← **empezar acá si no conocés Histrix** *(local, no versionado)*
- [08 — Plan de evolución](08-plan-evolucion.md) ← **la decisión estratégica y las fases**
  - [ADR 2026-10-01 — Cliente stateless, sin instancias](08-plan-evolucion.md#adr-2026-10-01--cliente-stateless-sin-instancias)
- [09 — Auditoría vs. Histrix (2026-09-30)](09-auditoria-2026-09-30.md) ← **gaps, bugs y qué hacer antes de seguir** *(local, no versionado, igual que 07)*

## TL;DR

- Es una **librería de componentes Vue 3 + Quasar 2** pensada para consumir el backend Histrix (XML/JSON schema-driven). Desde v0.1.0 **no soporta Vue 2** (esas apps quedan en `0.0.x`).
- Se publica en npm como `@mundoit-lib/histrix-component-vue` (repo `mundoit-lib/histrix-component-vue`).
- **Consumo source-only**: las apps clientes importan los `.vue` (import raíz, subpath o plugin) y los **compila el bundler de la app**. Solo se publica `ui/src/` (`files: ["src"]`); no hay build step.
- La superficie pública son **34 componentes** (21 top-level + 13 widgets), re-exportados desde `ui/src/index.js` (que también provee `install()` para `app.use`) y declarados como subpaths en `ui/package.json -> exports` (ver `03-componentes.md` para los que todavía faltan registrar).
- La lógica del motor (fórmulas, condiciones, tipos de pantalla/campo, filtros, export, fechas…) vive en **`ui/src/core/`: 15 módulos puros con 203 tests** (Vitest, `pnpm test`).
- **El cliente es stateless**: no usa las instancias de sesión del backend; lo que necesita se pide como endpoints/atributos stateless (ver el ADR en 08).
- El **dev playground** vive en `ui/dev/`: Vite + Quasar 2, consume la librería vía `link:..` (symlink vivo) y permite abrir cualquier XML contra un backend real (`pnpm dev` adentro de `ui/dev/`). Todo el repo usa **pnpm**.
- Lint/format unificado con **Biome** (`pnpm check` / `pnpm lint` en la raíz).
- Publicación automática en npm vía GitHub Actions cuando se pushea un tag `v*` (ver `.github/workflows/publish.yml`).
- El rumbo del proyecto (por qué Vue 3 + Quasar 2 y no React/shadcn, fases de refactor) está en [08-plan-evolucion.md](08-plan-evolucion.md).
