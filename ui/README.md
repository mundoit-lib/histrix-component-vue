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

Peers opcionales (declarados en `peerDependenciesMeta`): algunos componentes los usan si están instalados en la app.

| Paquete | Uso | Componentes |
| --- | --- | --- |
| `@mundoit-lib/plugin-vue-event` | bus `this.$events` | `HistrixForm`, `HistrixTable`, `HistrixLoginSplit`, `LoginForm`, `FormLoginNotStyles`, `HistrixExpansionMenu` |
| `vue-router@^4` | `this.$router` (navegación y redirects) | `HistrixApp`, `HistrixForm`, `HistrixTable`, `HistrixList`, `HistrixTree`, `HistrixMenuSearch`, `HistrixExpansionMenu` |

## Componentes

35 componentes Vue 3. Salvo `HistrixUnsupported` (aviso interno de `HistrixApp` para tipos de pantalla sin componente), todos se registran con el plugin y se exportan desde la raíz y por subpath.

| Grupo | Componentes |
|---|---|
| Pantallas schema-driven | `HistrixApp` (raíz: monta la pantalla según el schema), `HistrixForm`, `HistrixTable`, `HistrixTree`, `HistrixList`, `HistrixCalendar`, `HistrixDashboard`, `HistrixChart` |
| Piezas de pantalla | `HistrixField`, `HistrixCell`, `HistrixFilters`, `HistrixHelp` (picker de ayudas), `ExportForm`, `HistrixUnsupported` |
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

## Errores y notificaciones

Todos los métodos de `useApi()` rechazan con un `HistrixApiError`:

```js
import { isHistrixApiError } from '@mundoit-lib/histrix-component-vue';

try {
  await api.insertAppData('ventas/ing/cliente.xml', data);
} catch (e) {
  // e.status: 400 | 401 | 404 | 500 | 0 (red)
  // e.kind: 'validation' | 'auth' | 'not_found' | 'server' | 'network' | 'unknown'
  // e.message: texto legible (sin HTML); e.raw: error original de axios
}
```

`getAppData()` resuelve siempre `response.data.data` como array: un `204` o una consulta vacía dan `{ data: [] }`.

Ante un `401` la librería llama a `config.onUnauthorized(error)` (no toca el router):

```js
app.use(HistrixPlugin, {
  onUnauthorized: () => router.push('/login')
});
```

Las notificaciones pasan por un notifier inyectable con la interfaz
`{ success(msg), error(msg | HistrixApiError), info(msg), confirm(msg) → Promise<boolean> }`.
Por defecto el plugin registra uno con Quasar (`Notify` y `Dialog`, que tienen que estar habilitados en
`quasar.config`). Para usar otro, pasalo al instalar el plugin (los métodos que falten caen a la consola):

```js
app.use(HistrixPlugin, {
  notify: {
    success: (msg) => toast.success(msg),
    error: (msg, err) => toast.error(msg),
    info: (msg) => toast.info(msg),
    confirm: (msg) => miDialogo.confirmar(msg) // Promise<boolean>
  }
});
```

En los componentes:

```js
import { useHistrixNotify } from '@mundoit-lib/histrix-component-vue';

const notify = useHistrixNotify();
notify.error(e); // acepta un HistrixApiError
if (await notify.confirm('¿Eliminar el registro?')) { /* … */ }
```

## Atajos de teclado

`HistrixApp` replica los atajos del ERP legacy. Atiende las teclas la app más interna que tenga el foco, y si esa no resuelve F9 o Esc, los pasa a la app que la contiene (por ejemplo, del grid de renglones al comprobante).

| Tecla | Acción |
| --- | --- |
| `F9` | Procesa (igual que el botón Procesar: valida antes y sólo si el schema trae `can_process`). |
| `Esc` | Cierra el diálogo abierto más reciente. Si la app es `inner` y está dentro de un popup, emite `closepopup`. |
| `F2` | Abre la ayuda (`helpContainer`) del campo que tiene el foco. |
| `F4` | Limpia los filtros de búsqueda, si el foco está en un filtro. |
| `Enter` | Pasa al siguiente campo editable. En el último campo no graba, salvo que el form tenga `enter-submits`. |
| `Ctrl+K` / `⌘K`, `/` | Abre el buscador de programas (`HistrixMenuSearch`). |

Al cargar, el form pone el foco en el campo que tenga `autofocus` en el schema o, si ninguno lo tiene, en el primero editable.

Dentro de un `textarea`, un `contenteditable` o un `QEditor` no se intercepta ninguna tecla.

```vue
<!-- Sin atajos ni foco automático (también en las apps y forms que contiene) -->
<HistrixApp path="/ventas/fac.xml" :keyboard="false" />

<!-- Enter en el último campo graba el form -->
<HistrixApp path="/ventas/fac.xml" enter-submits />

<!-- Otro atajo para el buscador, y abrirlo desde código -->
<HistrixMenuSearch ref="search" hotkey="alt+m" />
<!-- this.$refs.search.show() / this.$refs.search.focus() -->
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
