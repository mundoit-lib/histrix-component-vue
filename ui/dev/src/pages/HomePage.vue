<template>
  <q-page class="q-pa-lg">
    <div class="text-h5 q-mb-sm">Playground de @mundoit-lib/histrix-component-vue</div>
    <div class="text-body2 text-grey-8 q-mb-lg">
      Smoke-test de la librería contra un backend Histrix real. Logueate y abrí
      un XML por su path para montar <code>&lt;HistrixApp&gt;</code>.
    </div>

    <q-banner v-if="!loggedIn" class="bg-orange-1 text-orange-9 q-mb-lg" rounded>
      <template v-slot:avatar>
        <q-icon name="info" color="orange" />
      </template>
      No estás logueado. Andá a
      <router-link :to="{ name: 'login' }">/login</router-link>
      para autenticarte contra el backend.
    </q-banner>

    <q-card flat bordered class="q-pa-md" style="max-width: 720px">
      <div class="text-subtitle1 q-mb-sm">Abrir un XML de Histrix</div>
      <q-input
        v-model="path"
        outlined
        dense
        clearable
        label="Path del XML"
        placeholder="ventas/qry/listado.xml"
        hint="Ruta relativa del XML (sin /api/db/{db}). Ej: clientes/abm/clientes.xml"
        @keyup.enter="open"
      >
        <template v-slot:append>
          <q-btn
            flat
            dense
            icon="open_in_new"
            label="Abrir"
            no-caps
            :disable="!path"
            @click="open"
          />
        </template>
      </q-input>

      <div class="row q-gutter-sm q-mt-md">
        <q-chip
          v-for="ex in examples"
          :key="ex"
          clickable
          color="primary"
          text-color="white"
          icon="description"
          @click="openPath(ex)"
        >
          {{ ex }}
        </q-chip>
      </div>
    </q-card>

    <q-card flat bordered class="q-pa-md q-mt-lg" style="max-width: 720px">
      <div class="text-subtitle1 q-mb-sm">Configuración activa</div>
      <div class="text-caption text-grey-8">
        <div>host (config.fixApi): <code>{{ cfg.fixApi || '—' }}</code></div>
        <div>db (config.db): <code>{{ cfg.db || '—' }}</code></div>
        <div>apiUrl efectivo: <code>{{ apiUrlPreview }}</code></div>
        <div>clientId: <code>{{ cfg.clientId ? '••• set' : '—' }}</code></div>
      </div>
    </q-card>
  </q-page>
</template>

<script>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import config from '../setup.js';

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter();
    const path = ref('');
    const examples = ['index.xml', 'clientes/abm/clientes.xml', 'ventas/qry/listado.xml'];

    const loggedIn = computed(() => !!localStorage.getItem('user') || !!localStorage.getItem('accessToken'));

    const normalize = (p) => (p || '').replace(/^\/+/, '').trim();

    const openPath = (p) => {
      const clean = normalize(p);
      if (!clean) return;
      router.push({ name: 'app', params: { path: clean } });
    };
    const open = () => openPath(path.value);

    const cfg = config;
    const apiUrlPreview = computed(() => {
      const host = localStorage.getItem('host') || config.fixApi || '';
      const db = localStorage.getItem('database') || config.db || '';
      return db ? `${host}/api/db/${db}` : config.apiUrl || host;
    });

    return { path, examples, loggedIn, open, openPath, cfg, apiUrlPreview };
  }
};
</script>
