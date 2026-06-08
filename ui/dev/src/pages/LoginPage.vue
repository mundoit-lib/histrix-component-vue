<template>
  <!--
    Así usa cada cliente el login: UN componente de la librería + props con sus
    datos (marca, color, foto, textos). Cero copy-paste de diseño. El componente
    es nativo (HTML + CSS scoped), no usa Quasar ni requiere config de UnoCSS.
  -->
  <HistrixLoginSplit
    :next-url="redirect"
    brand="Histrix"
    primary-color="#049DD9"
    tagline="ERP declarativo. Las pantallas se declaran en el backend y se renderizan acá."
    @success="onSuccess"
  >
    <!-- Slot opcional para info de entorno (solo en el playground / dev). -->
    <template #footer>
      <div class="env-info">
        <div>
          Backend: <code>{{ host || '(VITE_HISTRIX_HOST sin definir)' }}</code> ·
          <code>db: {{ db }}</code>
        </div>
        <div v-if="testEmail">
          Prueba: <code>{{ testEmail }}</code> / <code>{{ testPassword }}</code>
        </div>
      </div>
    </template>
  </HistrixLoginSplit>
</template>

<script>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import config from '../setup.js';

export default {
  name: 'LoginPage',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const redirect = computed(() => {
      const r = route.query.redirect;
      return typeof r === 'string' && r ? r : '/';
    });

    const host = computed(() => config.fixApi || '');
    const db = computed(() => config.db || '(sin db)');
    const testEmail = import.meta.env.VITE_TEST_EMAIL || '';
    const testPassword = import.meta.env.VITE_TEST_PASSWORD || '';

    // El componente emite 'success' tras login OK; navegamos al destino.
    const onSuccess = (nextUrl) => router.push(nextUrl || '/');

    return { redirect, host, db, testEmail, testPassword, onSuccess };
  }
};
</script>

<style scoped>
.env-info {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.5;
}
.env-info code {
  color: #6b7280;
}
</style>
