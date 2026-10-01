<template>
  <q-page v-if="page" :class="pageClass">
    <HistrixApp
      v-if="resolvedPath"
      :key="resolvedPath"
      v-bind="$attrs"
      :path="resolvedPath"
      :query="resolvedQuery"
      :title="resolvedTitle"
      :on-navigate="onNavigate"
    />
  </q-page>
  <div v-else :class="pageClass">
    <HistrixApp
      v-if="resolvedPath"
      :key="resolvedPath"
      v-bind="$attrs"
      :path="resolvedPath"
      :query="resolvedQuery"
      :title="resolvedTitle"
      :on-navigate="onNavigate"
    />
  </div>
</template>

<script>
import { resolvePagePath } from '../core/page.js';
import HistrixApp from './HistrixApp.vue';

/**
 * Página de app Histrix: reemplaza el `pages/Histrix.vue` que repetía cada app.
 * Toma `path` de la prop o de `$route.params.path`, `query` de la prop o de
 * `$route.query`, y el título de la prop o de `query._title`.
 *
 *   { path: '/app/:path(.*)', component: HistrixPage }
 */
export default {
  name: 'HistrixPage',
  components: { HistrixApp },
  inheritAttrs: false,
  props: {
    path: { type: String, default: '' },
    query: { type: Object, default: null },
    title: { type: String, default: '' },
    // Envuelve en <q-page> (necesita q-layout/q-page-container). false: un <div>.
    page: { type: Boolean, default: true },
    pageClass: { type: [String, Array, Object], default: '' },
    onNavigate: { type: Function, default: null }
  },
  computed: {
    resolvedPath() {
      return resolvePagePath(this.path || this.$route?.params?.path);
    },
    resolvedQuery() {
      return this.query || this.$route?.query || {};
    },
    resolvedTitle() {
      return this.title || this.resolvedQuery._title || '';
    }
  }
};
</script>
