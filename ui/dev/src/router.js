import { createRouter, createWebHistory } from 'vue-router';

import AppPage from './pages/AppPage.vue';
import HomePage from './pages/HomePage.vue';
import LoginPage from './pages/LoginPage.vue';
import StubPage from './pages/StubPage.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    // Ruta principal del playground: monta <HistrixApp :path="..." />.
    // El (.*) captura paths con barras: /app/ventas/qry/listado.xml
    path: '/app/:path(.*)',
    name: 'app',
    component: AppPage
  },
  {
    // HistrixExpansionMenu arma uris tipo /auth/<dir>/<archivo>.xml para los
    // ítems de menú. Las atendemos con la misma página de app (quitando /auth).
    path: '/auth/app/:path(.*)',
    name: 'auth-app',
    component: AppPage
  },
  // Rutas con nombre referenciadas por FormLoginNotStyles (:to="{ name: ... }").
  // Sin ellas vue-router tira al renderizar los q-btn del formulario de login.
  {
    path: '/register',
    name: 'register',
    component: StubPage,
    meta: { public: true }
  },
  {
    path: '/mail-reset-password',
    name: 'mail-reset-password',
    component: StubPage,
    meta: { public: true }
  },
  {
    // Fallback: cualquier otra cosa la tratamos como path de app
    // (los menús de Histrix pueden empujar rutas /<vue=path>).
    path: '/:path(.*)*',
    name: 'catch-all',
    component: AppPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// El guard de auth se registra en main.js (necesita $auth del plugin),
// siguiendo el patrón boot/router.js de las apps reales.

export default router;
