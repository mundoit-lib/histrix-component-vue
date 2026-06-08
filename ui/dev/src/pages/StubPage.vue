<template>
  <q-page class="flex flex-center">
    <q-card flat bordered class="q-pa-lg text-center" style="max-width: 480px">
      <q-icon name="construction" size="48px" color="grey-6" />
      <div class="text-h6 q-mt-sm">Pantalla no implementada en el playground</div>
      <div class="text-body2 text-grey-7 q-mt-sm">
        El formulario de login de la librería enlaza a
        <code>{{ name }}</code> (registro / recupero de contraseña). Este
        playground es solo para smoke-test, así que es un stub.
      </div>
      <q-btn class="q-mt-md" color="primary" no-caps label="Volver al login" :to="{ name: 'login' }" />
    </q-card>
  </q-page>
</template>

<script>
import { useRoute } from 'vue-router';

export default {
  name: 'StubPage',
  setup() {
    const route = useRoute();
    return { name: route.name };
  }
};
</script>
