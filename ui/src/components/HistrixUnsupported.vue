<template>
  <q-banner class="bg-grey-2 text-grey-9 q-ma-md" rounded>
    <template v-slot:avatar>
      <q-icon name="warning" color="warning" />
    </template>
    <div class="text-subtitle2">Tipo de pantalla no soportado</div>
    <div class="text-caption">
      Esta versión del cliente todavía no sabe mostrar pantallas de tipo
      <b>{{ schema?.type || '(sin tipo)' }}</b>.
    </div>
    <div v-if="path" class="text-caption text-grey-7">{{ path }}</div>
  </q-banner>
</template>

<script>
/**
 * Fallback visible de HistrixApp cuando `schema.type` no tiene componente:
 * reemplaza la pantalla en blanco de `<component :is="null">`.
 */
export default {
  name: 'HistrixUnsupported',
  inheritAttrs: false,
  props: {
    path: { type: String, default: '' },
    schema: { type: Object, default: () => ({}) }
  }
};
</script>
