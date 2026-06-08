import { createRouter, createWebHistory } from 'vue-router';

import AppPage from './pages/AppPage.vue';
import ForgotPasswordPage from './pages/ForgotPasswordPage.vue';
import HomePage from './pages/HomePage.vue';
import LoginPage from './pages/LoginPage.vue';
import RegisterPage from './pages/RegisterPage.vue';
import ResetPasswordPage from './pages/ResetPasswordPage.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true, fullscreen: true }
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
  // Rutas con nombre que enlazan login/registro/recupero de la librería.
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { public: true, fullscreen: true }
  },
  {
    path: '/mail-reset-password',
    name: 'mail-reset-password',
    component: ForgotPasswordPage,
    meta: { public: true, fullscreen: true }
  },
  {
    // Pantalla a la que apunta el link del mail de recupero: ?token=...&email=...
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordPage,
    meta: { public: true, fullscreen: true }
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
