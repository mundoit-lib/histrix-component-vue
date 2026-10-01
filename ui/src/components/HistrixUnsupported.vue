<template>
  <q-banner class="bg-grey-2 text-grey-9 q-ma-md" rounded>
    <template v-slot:avatar>
      <q-icon name="warning" color="warning" />
    </template>
    <div class="text-subtitle2">{{ t('unsupported.title') }}</div>
    <div class="text-caption">
      {{ t('unsupported.description') }}
      <b>{{ schema?.type || t('unsupported.noType') }}</b>.
    </div>
    <div v-if="path" class="text-caption text-grey-7">{{ path }}</div>
  </q-banner>
</template>

<script>
import { useHistrixI18n } from '../services/i18n.js';

/**
 * Fallback visible de HistrixApp cuando `schema.type` no tiene componente:
 * reemplaza la pantalla en blanco de `<component :is="null">`.
 */
export default {
  name: 'HistrixUnsupported',
  setup() {
    return { t: useHistrixI18n().t };
  },
  inheritAttrs: false,
  props: {
    path: { type: String, default: '' },
    schema: { type: Object, default: () => ({}) }
  }
};
</script>
