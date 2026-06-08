import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';

import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
// La librería vive un nivel arriba (ui/) y se enlaza como `link:..` (symlink
// vivo: editar ui/src se refleja al instante). Sus componentes .vue están en
// ui/src/ y Vite tiene que poder leerlos a través del symlink de node_modules.
const libRoot = resolve(here, '..');

// Resolución portable (npm y pnpm) del Quasar 2 del playground. Con pnpm el
// layout físico de node_modules es distinto (symlinks a .pnpm/), así que nunca
// hay que armar rutas a mano: require.resolve atraviesa los symlinks.
const require = createRequire(import.meta.url);
const quasarSrc = resolve(dirname(require.resolve('quasar/package.json')), 'src');

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: fileURLToPath(new URL('./src/quasar-variables.sass', import.meta.url))
    }),
    // Utility classes estilo Tailwind, como en todas las apps de Mundo IT
    // (config en unocss.config.js, espejo de angel-alvarez-frontend).
    Unocss()
  ],

  resolve: {
    // Una sola copia de vue / vue-demi / quasar en todo el grafo, aunque la
    // librería symlinkeada (ui/) tenga su propio node_modules con copias.
    dedupe: ['vue', 'vue-demi', 'quasar', '@vuelidate/core', '@vuelidate/validators'],
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // El @quasar/vite-plugin inyecta imports profundos `quasar/src/...`
      // (p.ej. el directive v-ripple) en los .vue de la librería; al compilarse
      // a través del symlink deben resolver contra el Quasar 2 del playground.
      { find: /^quasar\/src\//, replacement: `${quasarSrc}/` }
    ]
  },

  // `services/config.js` de la librería usa `process.env.X`. En el browser no
  // existe `process`; esto evita el ReferenceError. Los valores reales se
  // setean en runtime desde import.meta.env.VITE_* (ver src/setup.js).
  define: {
    'process.env': {}
  },

  optimizeDeps: {
    // La librería es source-only (.vue sin compilar) y está symlinkeada.
    // Hay que excluirla del pre-bundle para que Vite compile sus .vue con el
    // plugin de Vue en lugar de tratarla como dependencia ya construida.
    exclude: ['@mundoit-lib/histrix-component-vue'],
    // Estas sí conviene pre-bundlearlas (la lib las importa internamente).
    include: [
      '@vuelidate/core',
      '@vuelidate/validators',
      'vue-demi',
      'echarts',
      'vue-echarts',
      '@quasar/quasar-ui-qcalendar'
    ]
  },

  server: {
    port: 5180,
    fs: {
      // Permitir que el dev server sirva archivos de la raíz de la librería
      // (ui/) a través del symlink link:.. y del repo en general.
      allow: [here, libRoot, resolve(here, '..', '..')]
    }
  }
});
