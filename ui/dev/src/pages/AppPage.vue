<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <q-btn flat dense round icon="arrow_back" :to="{ name: 'home' }" class="q-mr-sm" />
      <div class="text-subtitle1">
        XML: <code>{{ path }}</code>
      </div>
      <q-space />
      <q-btn flat dense round icon="open_in_new" :disable="!path" @click="dialog = true">
        <q-tooltip>Abrir en HistrixAppDialog</q-tooltip>
      </q-btn>
      <q-btn flat dense round icon="refresh" @click="reloadKey++" />
    </div>
    <q-separator class="q-mb-md" />

    <q-banner v-if="!path" class="bg-red-1 text-red-9" rounded>
      No se especificó un path de XML.
    </q-banner>

    <!--
      HistrixPage es lo que reemplaza el pages/Histrix.vue de cada app: monta
      HistrixApp con el path (prop o $route.params.path), la query de la URL
      (?id=123 abre una ficha) y el título de query._title. Acá le pasamos el
      path ya limpio (sin el prefijo auth/ de los menús legacy) y page=false
      porque ya estamos dentro de un q-page.
      key fuerza el remount al cambiar de path o al apretar refresh.
    -->
    <HistrixPage
      v-else
      :key="`${path}#${reloadKey}`"
      :path="path"
      :page="false"
    />

    <!-- Misma app en un diálogo: se cierra sola en process-finish/closepopup. -->
    <HistrixAppDialog v-model="dialog" :path="path" :query="$route.query" :width="900" @finish="reloadKey++" />
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
    const dialog = ref(false);

    const path = computed(() => {
      let p = route.params.path;
      if (Array.isArray(p)) p = p.join('/');
      p = (p || '').replace(/^\/+/, '');
      // La ruta /auth/:path mapea uris de menú legacy; el XML real no lleva
      // el prefijo "auth/".
      p = p.replace(/^auth\//, '');
      return p;
    });

    return { path, reloadKey, dialog };
  }
};
</script>
