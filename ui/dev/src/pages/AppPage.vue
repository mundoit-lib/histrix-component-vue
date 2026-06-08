<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <q-btn flat dense round icon="arrow_back" :to="{ name: 'home' }" class="q-mr-sm" />
      <div class="text-subtitle1">
        XML: <code>{{ path }}</code>
      </div>
      <q-space />
      <q-btn flat dense round icon="refresh" @click="reloadKey++" />
    </div>
    <q-separator class="q-mb-md" />

    <q-banner v-if="!path" class="bg-red-1 text-red-9" rounded>
      No se especificó un path de XML.
    </q-banner>

    <!--
      HistrixApp es el componente raíz de la librería: recibe `path`, pide el
      schema a /api/db/{db}/schema/{path}, mira schema.type y monta el
      componente concreto (HistrixForm/Table/Chart/...). Usa $route.query
      internamente, por eso vive bajo el router. `query` permite pasar
      filtros/valores iniciales (?id=123 abre una ficha).
      key fuerza el remount al cambiar de path o al apretar refresh.
    -->
    <HistrixApp
      v-else
      :key="`${path}#${reloadKey}`"
      :path="path"
      :query="query"
    />
  </q-page>
</template>

<script>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'AppPage',
  setup() {
    const route = useRoute();
    const reloadKey = ref(0);

    const path = computed(() => {
      let p = route.params.path;
      if (Array.isArray(p)) p = p.join('/');
      p = (p || '').replace(/^\/+/, '');
      // La ruta /auth/:path mapea uris de menú legacy; el XML real no lleva
      // el prefijo "auth/".
      p = p.replace(/^auth\//, '');
      return p;
    });

    // Pasamos la query string de la URL como query props del componente.
    const query = computed(() => ({ ...route.query }));

    return { path, query, reloadKey };
  }
};
</script>
