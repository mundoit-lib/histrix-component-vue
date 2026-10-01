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

Además, algunos componentes usan cosas que tu app tiene que proveer aunque todavía no figuran como peers:

- **`vue-router`** (`$router`): `HistrixApp`, `HistrixTable`, `HistrixTree`, `HistrixList`, `HistrixExpansionMenu` y `HistrixMenuSearch` navegan con él.
- **`@mundoit-lib/plugin-vue-event`** (`$events`): `HistrixForm`, `HistrixTable`, `HistrixExpansionMenu` y los formularios de login disparan eventos globales (`closepopup`, `histrix-error-http`, `loaded-user`, `login-ok`…).

Si tu app no usa alguno de los dos, evitá esos componentes por ahora. La idea es que la librería deje de depender de ellos (emits en lugar del bus, navegación delegada a la app).

## Componentes

34 componentes Vue 3. Salvo `HistrixHelp` (interno de `HistrixField`), todos se registran con el plugin y se exportan desde la raíz.

| Grupo | Componentes |
|---|---|
| Pantallas schema-driven | `HistrixApp` (raíz: monta la pantalla según el schema), `HistrixForm`, `HistrixTable`, `HistrixTree`, `HistrixList`, `HistrixCalendar`, `HistrixDashboard`, `HistrixChart` |
| Piezas internas | `HistrixField`, `HistrixCell`, `HistrixFilters`, `HistrixHelp`, `ExportForm` |
| Auth nativa (sin Quasar) | `HistrixLoginSplit`, `HistrixRegisterSplit`, `HistrixForgotPasswordSplit`, `HistrixResetPasswordSplit` |
| Auth con Quasar | `LoginForm`, `FormLoginNotStyles`, `HistrixPasswordChange`, `InputPassword` |
| Menú y shell | `HistrixMenu`, `HistrixExpansionMenu`, `HistrixMenuSearch` (buscador con Ctrl/⌘+K), `FavoritItems`, `profileMenu`, `profileMenuItems`, `notificationMenu` |
| Conexión y utilidades | `DatabaseSelector`, `HistrixConnectionSettings`, `HistrixFileManager`, `HistrixLog`, `HistrixNews`, `HistrixUsers` |

El detalle de props y eventos de cada uno está en `docs/03-componentes.md` del repo.

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
