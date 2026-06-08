# @mundoit-lib/histrix-component-vue

[![npm](https://img.shields.io/npm/v/@mundoit-lib/histrix-component-vue.svg?label=@mundoit-lib/histrix-component-vue)](https://www.npmjs.com/package/@mundoit-lib/histrix-component-vue)

Componentes **Vue 3 + Quasar 2** para construir clientes del backend **Histrix** (ERP declarativo, schema-driven). El componente raíz `<HistrixApp :path="..."/>` pide el schema de un XML de Histrix al backend y monta la pantalla completa (tabla, formulario, calendario, dashboard, árbol, gráfico) sin programarla.

> **v0.1.0+ requiere Vue 3 nativo y Quasar 2.** Apps Vue 2: usar la serie `0.0.x`.

## Instalación

```bash
npm install @mundoit-lib/histrix-component-vue
```

**Distribución source-only**: el paquete contiene los `.vue` sin compilar; los compila el bundler de tu app (Vite / Quasar CLI / webpack).

Peers requeridos en tu app:

```bash
npm install vue@^3 quasar@^2 @vuelidate/core @vuelidate/validators \
  @mundoit-lib/plugin-vue-axios @mundoit-lib/plugin-vue-auth
```

## Uso

```js
// Como plugin (registra todos los componentes globalmente):
import HistrixPlugin from '@mundoit-lib/histrix-component-vue/plugin';
app.use(HistrixPlugin);

// Named imports:
import { HistrixApp, HistrixTable, config } from '@mundoit-lib/histrix-component-vue';

// Por subpath (tree-shaking manual):
import HistrixForm from '@mundoit-lib/histrix-component-vue/components/HistrixForm';
import useApi from '@mundoit-lib/histrix-component-vue/services/histrixApi';
```

Configuración runtime (host del backend, base, credenciales OAuth):

```js
import { config } from '@mundoit-lib/histrix-component-vue';

config.fixApi = 'https://mi-backend-histrix.com';
config.db = 'micliente';
config.clientId = '...';
config.clientSecret = '...';
```

```vue
<!-- Montar cualquier pantalla declarada en un XML de Histrix: -->
<HistrixApp path="ventas/qry/listado.xml" :query="{ id: 123 }" />
```

## Desarrollo

El playground vive en `dev/` (Vite + Quasar 2, consume esta librería vía `link:..`). Todo el repo usa **pnpm**:

```bash
pnpm install           # deps de la librería (en ui/)
cd dev
pnpm install
cp .env.example .env   # completar host/db/credenciales
pnpm dev
```

La documentación interna completa (arquitectura, contrato del schema, trampas del backend) está en el [repo](https://github.com/mundoit-lib/histrix-component-vue), carpeta `docs/`.

## Licencia

MIT (c) Luis M. Melgratti <luis@mundoit.com.ar>
