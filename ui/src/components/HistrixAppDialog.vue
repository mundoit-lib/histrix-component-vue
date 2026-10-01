<template>
  <q-dialog
    :model-value="modelValue"
    :maximized="maximized"
    @update:model-value="setOpen"
  >
    <q-card class="column no-wrap" :style="cardStyle">
      <q-bar class="bg-primary text-white">
        <div class="ellipsis">{{ title || query?._title || '' }}</div>
        <q-space />
        <q-btn dense flat round icon="close" @click="setOpen(false)" />
      </q-bar>
      <q-card-section class="col q-pa-none scroll">
        <HistrixApp
          v-if="modelValue && path"
          v-bind="$attrs"
          :path="path"
          :query="query || {}"
          :title="title || query?._title"
          :on-navigate="onNavigate"
          @process-finish="finish"
          @closepopup="finish"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { dialogWidthStyle } from '../core/page.js';
import HistrixApp from './HistrixApp.vue';

/**
 * App Histrix en un diálogo (reemplaza los `HistrixAppCard` de cada app).
 *
 *   <HistrixAppDialog v-model="open" path="ventas/abm_clientes.xml" :query="{ id }" @finish="reload" />
 *
 * Se cierra solo cuando la app termina (`process-finish`) o pide cerrarse
 * (`closepopup`), y emite `finish` con el dato del proceso.
 */
export default {
  name: 'HistrixAppDialog',
  components: { HistrixApp },
  inheritAttrs: false,
  props: {
    modelValue: { type: Boolean, default: false },
    path: { type: String, default: '' },
    query: { type: Object, default: null },
    title: { type: String, default: '' },
    // Ancho del card: número (px) o string CSS ('80vw'). Vacío: el de Quasar.
    width: { type: [Number, String], default: '' },
    maximized: { type: Boolean, default: false },
    onNavigate: { type: Function, default: null }
  },
  emits: ['update:modelValue', 'finish'],
  computed: {
    cardStyle() {
      return this.maximized ? {} : dialogWidthStyle(this.width);
    }
  },
  methods: {
    setOpen(value) {
      this.$emit('update:modelValue', value);
    },
    finish(data) {
      this.setOpen(false);
      this.$emit('finish', data);
    }
  }
};
</script>
