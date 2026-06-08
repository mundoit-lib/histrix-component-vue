<template>
  <q-layout view="hHh lpR fFf">
    <!-- En las pantallas de auth (login/registro/recupero/reset) no mostramos el
         chrome del playground: son full-screen (meta.fullscreen en el router). -->
    <q-header v-if="!isAuthScreen" elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          v-if="loggedIn"
          flat
          dense
          round
          icon="menu"
          aria-label="Menú"
          @click="drawer = !drawer"
        />
        <q-toolbar-title>
          Histrix Dev Playground
          <span class="text-caption q-ml-sm" style="opacity: 0.8">
            {{ dbLabel }}
          </span>
        </q-toolbar-title>

        <q-btn flat dense no-caps icon="home" label="Home" :to="{ name: 'home' }" />
        <q-btn
          v-if="!loggedIn"
          flat
          dense
          no-caps
          icon="login"
          label="Login"
          :to="{ name: 'login' }"
        />
        <q-btn
          v-else
          flat
          dense
          no-caps
          icon="logout"
          label="Salir"
          @click="logout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="loggedIn && !isAuthScreen"
      v-model="drawer"
      show-if-above
      bordered
      :width="300"
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <div class="text-caption text-grey-7 q-pa-md">Menú Histrix (nivel raíz)</div>
        <!--
          HistrixExpansionMenu pide el menú con getMenu(level) al montar.
          Sin level usa el nivel raíz. Necesita sesión válida (de ahí el v-if).
        -->
        <HistrixExpansionMenu
          :is-favorite="true"
          @close-drawer="drawer = false"
          level="phpmen"
        />
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import config from './setup.js';

export default {
  name: 'App',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { proxy } = getCurrentInstance();

    // Pantallas full-screen sin chrome (login/registro/recupero/reset).
    const isAuthScreen = computed(() => route.meta.fullscreen === true);

    const drawer = ref(false);
    const loggedIn = ref(!!localStorage.getItem('user') || !!localStorage.getItem('accessToken'));

    const refresh = () => {
      loggedIn.value = !!localStorage.getItem('user') || !!localStorage.getItem('accessToken');
    };

    const dbLabel = computed(() => {
      const db = localStorage.getItem('database') || config.db || '(sin db)';
      const host = (localStorage.getItem('host') || config.fixApi || '').replace(/^https?:\/\//, '');
      return host ? `${db} @ ${host}` : db;
    });

    const logout = () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpireDate');
      localStorage.removeItem('user');
      refresh();
      router.push({ name: 'login' });
    };

    // El form de login de la librería dispara estos eventos al loguear OK.
    onMounted(() => {
      proxy.$events?.on('login-ok', refresh);
      proxy.$events?.on('loaded-user', refresh);
    });
    onUnmounted(() => {
      proxy.$events?.off('login-ok', refresh);
      proxy.$events?.off('loaded-user', refresh);
    });

    return { drawer, loggedIn, isAuthScreen, dbLabel, logout, refresh };
  }
};
</script>
