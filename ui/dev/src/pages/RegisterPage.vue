<template>
  <!--
    Pantalla de registro de la librería. Los campos obligatorios (nombre, email,
    teléfono, password, confirmación + profile_id) los maneja el componente; los
    campos extra van a `props` y los define el cliente vía `extra-fields` (o el
    slot #extra para inputs complejos).
  -->
  <HistrixRegisterSplit
    brand="Histrix"
    primary-color="#049DD9"
    tagline="Creá tu cuenta para empezar a operar."
    :profile-id="13"
    show-database
    @success="onSuccess"
  />
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'RegisterPage',
  setup() {
    const router = useRouter();

    const onSuccess = () => router.push({ name: 'login' });

    return { onSuccess };
  }
};
</script>
