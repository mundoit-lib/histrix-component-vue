<template>
  <div class="htx-login">
    <!-- Columna izquierda: formulario -->
    <section class="htx-login__form-col">
      <div class="htx-login__form-wrap">
        <!-- Branding (slot #brand para reemplazarlo entero) -->
        <slot name="brand">
          <div class="htx-login__brand">
            <div class="htx-login__brand-row">
              <img v-if="logo" :src="logo" :alt="brand" class="htx-login__logo" />
              <span v-else class="htx-login__logo-fallback" :style="{ backgroundColor: primaryColor }">
                {{ brand.charAt(0).toUpperCase() }}
              </span>
              <span class="htx-login__brand-name">{{ brand }}</span>
            </div>
            <h1 class="htx-login__title">{{ title }}</h1>
            <p class="htx-login__subtitle">{{ subtitle }}</p>
          </div>
        </slot>

        <form class="htx-login__form" novalidate @submit.prevent="onSubmit">
          <!-- Usuario / email -->
          <div class="htx-login__field-group">
            <label class="htx-login__field">
              <svg class="htx-login__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 4l-8 5l-8-5V6l8 5l8-5z"
                />
              </svg>
              <input
                v-model="email"
                type="text"
                autocomplete="username"
                autofocus
                :placeholder="emailPlaceholder"
                class="htx-login__input"
                :class="{ 'htx-login__input--error': v$.email.$error }"
                @blur="v$.email.$touch()"
              />
            </label>
            <p v-if="v$.email.$error" class="htx-login__field-error">{{ v$.email.$errors[0].$message }}</p>
          </div>

          <!-- Contraseña -->
          <div class="htx-login__field-group">
            <label class="htx-login__field">
              <svg class="htx-login__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3"
                />
              </svg>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :placeholder="passwordPlaceholder"
                class="htx-login__input"
                :class="{ 'htx-login__input--error': v$.password.$error }"
                @blur="v$.password.$touch()"
              />
              <button
                type="button"
                class="htx-login__toggle"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <svg viewBox="0 0 24 24" class="htx-login__toggle-icon" aria-hidden="true">
                  <path
                    v-if="showPassword"
                    fill="currentColor"
                    d="M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5"
                  />
                  <path
                    v-else
                    fill="currentColor"
                    d="M11.83 9L15 12.16V12a3 3 0 0 0-3-3zm-4.3.8l1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28l.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22L21 20.73L3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7"
                  />
                </svg>
              </button>
            </label>
            <p v-if="v$.password.$error" class="htx-login__field-error">{{ v$.password.$errors[0].$message }}</p>
          </div>

          <!-- Error del servidor (credenciales incorrectas), sin q-notify -->
          <p v-if="errorMsg" class="htx-login__error">{{ errorMsg }}</p>

          <!-- Botón: color por prop, vía :style -->
          <button type="submit" class="htx-login__submit" :style="{ backgroundColor: primaryColor }" :disabled="loading">
            <span v-if="loading" class="htx-login__spinner" aria-hidden="true" />
            {{ loading ? loadingLabel : submitLabel }}
          </button>

          <slot name="footer" />
        </form>
      </div>
    </section>

    <!-- Columna derecha: panel visual (slot #panel para reemplazarlo) -->
    <section class="htx-login__panel" :style="panelStyle">
      <slot name="panel">
        <div class="htx-login__blob htx-login__blob--tr" />
        <div class="htx-login__blob htx-login__blob--bl" />
        <div class="htx-login__panel-content">
          <div class="htx-login__panel-title">{{ brand }}</div>
          <p v-if="tagline" class="htx-login__panel-tagline">{{ tagline }}</p>
        </div>
      </slot>
    </section>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import useApi from '../services/histrixApi.js';

export default {
  name: 'HistrixLoginSplit',
  props: {
    /** A dónde redirigir tras login OK (lo emite el componente; el padre navega). */
    nextUrl: { type: String, default: '/' },
    /** Nombre de marca (título del panel + inicial del logo por defecto). */
    brand: { type: String, default: 'Histrix' },
    /** URL del logo. Si está vacío, se muestra la inicial de `brand`. */
    logo: { type: String, default: '' },
    /** URL de la foto del panel derecho. Si está vacío, se usa un gradiente. */
    image: { type: String, default: '' },
    /** Color de marca (botón, logo por defecto, gradiente). */
    primaryColor: { type: String, default: '#049DD9' },
    /** Subtítulo del panel derecho. */
    tagline: { type: String, default: '' },
    /** Encabezado y subtítulo del formulario. */
    title: { type: String, default: 'Iniciar sesión' },
    subtitle: { type: String, default: 'Ingresá tus credenciales para continuar.' },
    emailPlaceholder: { type: String, default: 'Correo electrónico o usuario' },
    passwordPlaceholder: { type: String, default: 'Contraseña' },
    submitLabel: { type: String, default: 'Ingresar' },
    loadingLabel: { type: String, default: 'Ingresando…' }
  },
  emits: ['success', 'error'],
  setup() {
    const { login } = useApi();
    return { login, v$: useVuelidate() };
  },
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      loading: false,
      errorMsg: ''
    };
  },
  validations() {
    return {
      email: { required: helpers.withMessage('Ingresá tu usuario o correo.', required) },
      password: { required: helpers.withMessage('Ingresá tu contraseña.', required) }
    };
  },
  computed: {
    panelStyle() {
      if (this.image) {
        return {
          backgroundImage: `url(${this.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      }
      // Gradiente con el color de marca (oscurecido para el final).
      return {
        backgroundImage: `linear-gradient(135deg, ${this.primaryColor} 0%, ${this.shade(this.primaryColor, -0.45)} 100%)`
      };
    }
  },
  methods: {
    async onSubmit() {
      this.errorMsg = '';
      // Validación con Vuelidate (mismo patrón que HistrixForm/FormLoginNotStyles).
      const valid = await this.v$.$validate();
      if (!valid) return;
      this.loading = true;
      try {
        await this.login(this.email, this.password, this.nextUrl);
        // Compat con apps que escuchan el bus global (igual que FormLoginNotStyles).
        if (this.$events) {
          this.$events.fire('login-ok');
          this.$events.fire('loaded-user');
        }
        this.$emit('success', this.nextUrl);
      } catch (e) {
        this.errorMsg = 'Usuario o contraseña incorrectos.';
        this.$emit('error', e);
      } finally {
        this.loading = false;
        this.password = '';
        // Limpiamos password sin que dispare el error "requerido" del campo.
        this.v$.password.$reset();
      }
    },
    /** Oscurece/aclara un hex (#rrggbb) por un factor [-1, 1]. */
    shade(hex, factor) {
      const h = hex.replace('#', '');
      if (h.length !== 6) return hex;
      const num = Number.parseInt(h, 16);
      const t = factor < 0 ? 0 : 255;
      const p = Math.abs(factor);
      const r = Math.round(((num >> 16) & 0xff) * (1 - p) + t * p);
      const g = Math.round(((num >> 8) & 0xff) * (1 - p) + t * p);
      const b = Math.round((num & 0xff) * (1 - p) + t * p);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  }
};
</script>

<style scoped>
/*
  Todo el estilo es CSS scoped propio: el componente se ve igual en cualquier
  app, tenga o no UnoCSS/Tailwind, y no hereda nada de Quasar. Customización
  fina vía props (color/logo/foto/textos) o slots (#brand/#panel/#footer).
*/
.htx-login {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  min-height: 100dvh;
  font-family: inherit;
}
.htx-login__form-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding: 2.5rem 2rem;
  background: #fff;
}
.htx-login__form-wrap {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}
.htx-login__panel {
  display: none; /* oculto en mobile */
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
@media (min-width: 800px) {
  .htx-login__form-col {
    width: 440px;
    flex: none;
  }
  .htx-login__panel {
    display: flex;
  }
}

/* Branding */
.htx-login__brand {
  margin-bottom: 2rem;
}
.htx-login__brand-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.htx-login__logo {
  height: 2.25rem;
  width: auto;
}
.htx-login__logo-fallback {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.125rem;
}
.htx-login__brand-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}
.htx-login__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}
.htx-login__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Form */
.htx-login__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.htx-login__field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.htx-login__field {
  position: relative;
  display: block;
}
.htx-login__icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}
.htx-login__input {
  box-sizing: border-box;
  width: 100%;
  height: 2.75rem;
  padding: 0 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  color: #111827;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fff;
}
.htx-login__input:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.htx-login__input--error {
  border-color: #dc2626;
}
.htx-login__input--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}
.htx-login__field-error {
  margin: 0;
  font-size: 0.8rem;
  color: #dc2626;
}
.htx-login__toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
}
.htx-login__toggle:hover {
  color: #6b7280;
}
.htx-login__toggle-icon {
  width: 1.25rem;
  height: 1.25rem;
}
.htx-login__error {
  margin: -0.25rem 0 0;
  font-size: 0.875rem;
  color: #dc2626;
}

/* Botón submit */
.htx-login__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 2.75rem;
  margin-top: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  color: #fff;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: filter 0.15s;
}
.htx-login__submit:hover:not(:disabled) {
  filter: brightness(0.94);
}
.htx-login__submit:disabled {
  opacity: 0.7;
  cursor: default;
}
.htx-login__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 9999px;
  animation: htx-login-spin 0.6s linear infinite;
}
@keyframes htx-login-spin {
  to { transform: rotate(360deg); }
}

/* Panel derecho */
.htx-login__panel-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 3rem;
  color: #fff;
}
.htx-login__panel-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}
.htx-login__panel-tagline {
  margin: 1rem auto 0;
  max-width: 24rem;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
}
.htx-login__blob {
  position: absolute;
  border-radius: 9999px;
}
.htx-login__blob--tr {
  top: -6rem;
  right: -6rem;
  width: 24rem;
  height: 24rem;
  background: rgba(255, 255, 255, 0.1);
}
.htx-login__blob--bl {
  bottom: -6rem;
  left: -4rem;
  width: 20rem;
  height: 20rem;
  background: rgba(255, 255, 255, 0.08);
}
</style>
