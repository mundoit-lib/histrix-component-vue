# 02 — Estructura del repositorio

```
histrix-quasar-client/
├── biome.json              # Config Biome (lint+format unificados)
├── jsconfig.json           # Alias "ui/*" → "src/*"
├── package.json            # Sólo herramientas raíz (Biome)
├── pnpm-lock.yaml          # Lockfile raíz (pnpm)
├── skills-lock.json        # Skills de agente instaladas en el repo
├── README.md               # Overview del repo
├── LICENSE                 # MIT (Luis M. Melgratti)
│
├── .agents/skills/         # frontend-design + web-design-guidelines (Claude skills)
├── .github/workflows/      # publish.yml (npm publish en tags v*)
├── .claude/, .vscode/      # Configs de editor y agente
│
├── docs/                   # ← Esta documentación
│
└── ui/                     # Paquete npm publicable
    ├── package.json        # @mundoit-lib/histrix-component-vue (files: ["src"])
    ├── pnpm-lock.yaml      # Lockfile (deps runtime: qcalendar/echarts/vue-echarts + peers)
    ├── README.md           # README del paquete (lo que se ve en npmjs.com)
    │
    ├── dev/                # Playground Vite + Vue 3 + Quasar 2 (NO se publica)
    │   ├── package.json    # Consume la lib vía "link:.." (symlink vivo, exports reales)
    │   ├── vite.config.js  # @quasar/vite-plugin + define process.env + dedupe vue/quasar
    │   ├── .env.example    # VITE_HISTRIX_HOST / _DB / VITE_CLIENT_ID / _SECRET
    │   ├── index.html
    │   └── src/
    │       ├── main.js     # Quasar (Notify/Dialog/Loading, lang es) + plugins mundoit + HistrixPlugin
    │       ├── setup.js    # Vuelca import.meta.env.VITE_* a config de la librería
    │       ├── router.js   # /login, / (home), /app/:path(.*) → HistrixApp
    │       ├── App.vue     # QLayout + drawer con menú Histrix
    │       └── pages/      # LoginPage, HomePage, AppPage, StubPage
    │
    └── src/                # ← CÓDIGO FUENTE DE LA LIBRERÍA (esto viaja en npm)
        ├── index.js              # Imports + install(app) plugin (registra todo)
        ├── index.esm.js          # Entry del import raíz (named + default)
        ├── components/          # Componentes top-level (ver 03-componentes.md)
        │   └── widgets/         # Subcomponentes UI
        ├── core/                # Lógica PURA del motor (sin Vue/Quasar), testeada (Fase 2)
        │   ├── formula.js            # evaluador aritmético de computed_fields (sin eval)
        │   ├── keys.js               # claves primarias del schema
        │   ├── screenType.js         # schema.type → kind de pantalla
        │   ├── fieldType.js          # histrix_type → tipo de input
        │   ├── options.js            # normalización de combos (3 variantes)
        │   ├── filters.js            # querystring pseudo-OData
        │   ├── fieldVisibility.js    # editable / columnas visibles
        │   ├── dates.js              # conversión dd/mm/yyyy ↔ ISO (sin Quasar)
        │   └── *.test.js             # tests colocalizados (Vitest, 119 en total)
        └── services/            # Cliente API + helpers (ver 04-servicios.md)
            ├── histrixApi.js         # useApi(): todos los endpoints (agnóstico de Quasar)
            ├── config.js             # Config runtime (Proxy sobre process.env)
            ├── histrix-bearer.js     # Driver bearer para plugin-vue-auth
            └── asyncComponents.js    # defineLazyComponent (async + loading/error states)
```

## Notas importantes

- **Consumo source-only**: el tarball publicado contiene solo `ui/src/` (`files: ["src"]` en `ui/package.json`). Los clientes compilan los `.vue` con su propio bundler (Vue 3 + Quasar 2).
- **Vue 3 only desde v0.1.0**: no queda código de compatibilidad Vue 2 (`vue-demi`, `.sync`, `@vue/composition-api` fueron eliminados en la Fase 1 — ver `08-plan-evolucion.md`).
- **El pipeline de build legacy (`ui/build/`), los entries UMD/CJS (`index.common.js`, `index.umd.js`, `index.sass`) y `umd-test.html` fueron eliminados.** Si alguna vez hace falta un bundle standalone, están en el historial de git (hasta `v0.0.199`).
- El bump de versión se hace a mano en `ui/package.json` y se etiqueta con `git tag v0.1.x` (ver `05-build-publish.md`).
- Package manager: **pnpm en todo el repo** (raíz, `ui/` y `ui/dev/`). El único npm que queda es el `npm publish` del CI, que no usa lockfile.

## Convenciones de archivos

- Componentes: **PascalCase** (`HistrixTable.vue`), excepto los widgets antiguos `profileMenu.vue`, `profileMenuItems.vue`, `notificationMenu.vue` que quedaron en camelCase.
- Cada `.vue` declara su `name:`, que es el tag con el que `install()` lo registra globalmente (`app.component(c.name, c)`).
- Las colisiones históricas de `name` están resueltas: `HistrixTree.vue` ahora declara `'HistrixTree'` (antes pisaba a `'HistrixTable'`) y el typo `'HistrixConectionSettings'` se corrigió a `'HistrixConnectionSettings'`.
