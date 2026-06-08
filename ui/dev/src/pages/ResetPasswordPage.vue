<template>
  <!--
    Pantalla a la que apunta el link del mail (?token=...&email=...). Fija la
    nueva contraseña: POST /api/resetpassword/ con
    { email, password, confirm_password, token, recover, db }.
  -->
  <HistrixResetPasswordSplit
    brand="Histrix"
    primary-color="#049DD9"
    tagline="Elegí tu nueva contraseña."
    show-database
    :recover-url="recoverUrl"
    @success="onSuccess"
  />
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'ResetPasswordPage',
  setup() {
    const router = useRouter();
    const recoverUrl = computed(() => `${window.location.origin}/reset-password`);
    const onSuccess = () => router.push({ name: 'login' });
    return { recoverUrl, onSuccess };
  }
};
</script>
