<template>
  <!--
    Pantalla de recupero de contraseña de la librería. Pide el email y dispara
    el envío del correo (POST /api/resetpassword/ con { email, recover, db }).
    `recover-url` es la URL del cliente donde el usuario fija la nueva contraseña.
  -->
  <HistrixForgotPasswordSplit
    brand="Histrix"
    primary-color="#049DD9"
    tagline="Recuperá el acceso a tu cuenta."
    show-database
    :recover-url="recoverUrl"
  />
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'ForgotPasswordPage',
  setup() {
    const recoverUrl = computed(() => `${window.location.origin}/reset-password`);
    return { recoverUrl };
  }
};
</script>
