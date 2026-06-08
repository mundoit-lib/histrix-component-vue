<template>
  <div class="htx-auth">
    <!-- Columna izquierda: formulario -->
    <section class="htx-auth__form-col">
      <div class="htx-auth__form-wrap">
        <!-- Branding (slot #brand para reemplazarlo entero) -->
        <slot name="brand">
          <div class="htx-auth__brand">
            <div class="htx-auth__brand-row">
              <img v-if="logo" :src="logo" :alt="brand" class="htx-auth__logo" />
              <span v-else class="htx-auth__logo-fallback" :style="{ backgroundColor: primaryColor }">
                {{ brand.charAt(0).toUpperCase() }}
              </span>
              <span class="htx-auth__brand-name">{{ brand }}</span>
            </div>
            <h1 class="htx-auth__title">{{ title }}</h1>
            <p class="htx-auth__subtitle">{{ subtitle }}</p>
          </div>
        </slot>

        <!-- Estado: enviado -->
        <div v-if="sent" class="htx-auth__sent">
          <p class="htx-auth__ok">{{ okMsg }}</p>
          <router-link :to="loginTo" class="htx-auth__link" :style="{ color: primaryColor }">
            {{ loginLabel }}
          </router-link>
        </div>

        <!-- Estado: formulario -->
        <form v-else class="htx-auth__form" novalidate @submit.prevent="onSubmit">
          <!-- Selector de base de datos (opcional, prop `showDatabase`) -->
          <div v-if="showDatabase" class="htx-auth__field-group">
            <label class="htx-auth__field">
              <svg class="htx-auth__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4s8-1.79 8-4s-3.58-4-8-4M4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4m0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8 1.79-8 4z"
                />
              </svg>
              <select v-model="db" class="htx-auth__input htx-auth__select">
                <option value="" disabled>{{ databasePlaceholder }}</option>
                <option v-for="opt in databases" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="htx-auth__chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M7 10l5 5l5-5z" />
              </svg>
            </label>
          </div>

          <div class="htx-auth__field-group">
            <label class="htx-auth__field">
              <svg class="htx-auth__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 4l-8 5l-8-5V6l8 5l8-5z"
                />
              </svg>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                autofocus
                :placeholder="emailPlaceholder"
                class="htx-auth__input"
                :class="{ 'htx-auth__input--error': v$.email.$error }"
                @blur="v$.email.$touch()"
              />
            </label>
            <p v-if="v$.email.$error" class="htx-auth__field-error">{{ v$.email.$errors[0].$message }}</p>
          </div>

          <p v-if="errorMsg" class="htx-auth__error">{{ errorMsg }}</p>

          <button type="submit" class="htx-auth__submit" :style="{ backgroundColor: primaryColor }" :disabled="loading">
            <span v-if="loading" class="htx-auth__spinner" aria-hidden="true" />
            {{ loading ? loadingLabel : submitLabel }}
          </button>

          <div class="htx-auth__actions">
            <router-link :to="loginTo" class="htx-auth__link" :style="{ color: primaryColor }">
              {{ loginLabel }}
            </router-link>
          </div>

          <slot name="footer" />
        </form>
      </div>
    </section>

    <!-- Columna derecha: panel visual (slot #panel para reemplazarlo) -->
    <section class="htx-auth__panel" :style="panelStyle">
      <slot name="panel">
        <div class="htx-auth__blob htx-auth__blob--tr" />
        <div class="htx-auth__blob htx-auth__blob--bl" />
        <div class="htx-auth__panel-content">
          <div class="htx-auth__panel-title">{{ brand }}</div>
          <p v-if="tagline" class="htx-auth__panel-tagline">{{ tagline }}</p>
        </div>
      </slot>
    </section>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core';
import { email as emailValidator, helpers, required } from '@vuelidate/validators';

import config from '../services/config.js';
import useApi from '../services/histrixApi.js';
import { shade } from '../utils/color.js';

export default {
  name: 'HistrixForgotPasswordSplit',
  props: {
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
    title: { type: String, default: 'Recuperar contraseña' },
    subtitle: { type: String, default: 'Te enviaremos un correo para restablecerla.' },
    emailPlaceholder: { type: String, default: 'Correo electrónico' },
    submitLabel: { type: String, default: 'Enviar enlace' },
    loadingLabel: { type: String, default: 'Enviando…' },

    /** Enlace de vuelta al login. */
    loginLabel: { type: String, default: 'Volver al inicio de sesión' },
    loginTo: { type: [String, Object], default: () => ({ name: 'login' }) },

    /**
     * URL que el backend incrusta en el mail de recupero (campo `recover`).
     * Debe apuntar a la pantalla de reseteo del cliente (ej. `${origin}/reset-password`).
     */
    recoverUrl: { type: String, default: '' },

    /** Muestra el selector de base de datos (busca las DB y configura la elegida). */
    showDatabase: { type: Boolean, default: false },
    /** Placeholder del selector de base de datos. */
    databasePlaceholder: { type: String, default: 'Seleccioná una base de datos' }
  },
  emits: ['success', 'error', 'db-change'],
  setup() {
    const { resetPassword, apiDBQuery, currentDb } = useApi();
    return { resetPassword, apiDBQuery, currentDb, v$: useVuelidate() };
  },
  data() {
    return {
      email: '',
      loading: false,
      sent: false,
      errorMsg: '',
      okMsg: '',
      /** Base de datos seleccionada. */
      db: '',
      /** Bases de datos disponibles ({ value, label, img }). */
      databases: []
    };
  },
  watch: {
    /** Al elegir base de datos: persistir y reconfigurar el cliente API. */
    db(newVal) {
      if (!newVal) return;
      config.db = newVal;
      localStorage.setItem('database', newVal);
      this.$emit('db-change', newVal);
    }
  },
  mounted() {
    if (!this.showDatabase) return;
    this.apiDBQuery()
      .then((list) => {
        this.databases = list;
        const current = config.db;
        if (current && list.some((opt) => opt.value === current)) {
          this.db = current;
        }
      })
      .catch((e) => this.$emit('error', e));
  },
  validations() {
    return {
      email: {
        required: helpers.withMessage('Ingresá tu correo.', required),
        email: helpers.withMessage('Correo inválido.', emailValidator)
      }
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
      return {
        backgroundImage: `linear-gradient(135deg, ${this.primaryColor} 0%, ${shade(this.primaryColor, -0.45)} 100%)`
      };
    }
  },
  methods: {
    async onSubmit() {
      this.errorMsg = '';
      const valid = await this.v$.$validate();
      if (!valid) return;
      this.loading = true;
      const payload = {
        email: this.email,
        recover: this.recoverUrl,
        db: this.currentDb()
      };
      try {
        const resp = await this.resetPassword(payload);
        this.okMsg = resp?.data?.responseText || 'Te enviamos un correo con las instrucciones.';
        this.sent = true;
        this.$emit('success', { payload, response: resp });
      } catch (e) {
        this.errorMsg = e?.response?.data?.responseText || 'No se pudo enviar el correo. Verificá los datos.';
        this.$emit('error', e);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Mismo lenguaje visual que HistrixLoginSplit / HistrixRegisterSplit. */
.htx-auth {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  min-height: 100dvh;
  font-family: inherit;
}
.htx-auth__form-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding: 2.5rem 2rem;
  background: #fff;
}
.htx-auth__form-wrap {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}
.htx-auth__panel {
  display: none;
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
@media (min-width: 800px) {
  .htx-auth__form-col {
    width: 440px;
    flex: none;
  }
  .htx-auth__panel {
    display: flex;
  }
}

/* Branding */
.htx-auth__brand {
  margin-bottom: 2rem;
}
.htx-auth__brand-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.htx-auth__logo {
  height: 2.25rem;
  width: auto;
}
.htx-auth__logo-fallback {
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
.htx-auth__brand-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}
.htx-auth__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}
.htx-auth__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Form */
.htx-auth__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.htx-auth__sent {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}
.htx-auth__field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.htx-auth__field {
  position: relative;
  display: block;
}
.htx-auth__icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}
.htx-auth__input {
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
.htx-auth__input:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.htx-auth__input--error {
  border-color: #dc2626;
}
.htx-auth__input--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}
.htx-auth__select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
}
.htx-auth__chevron {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}
.htx-auth__field-error {
  margin: 0;
  font-size: 0.8rem;
  color: #dc2626;
}
.htx-auth__error {
  margin: -0.25rem 0 0;
  font-size: 0.875rem;
  color: #dc2626;
}
.htx-auth__ok {
  margin: 0;
  font-size: 0.95rem;
  color: #059669;
}

/* Botón submit */
.htx-auth__submit {
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
.htx-auth__submit:hover:not(:disabled) {
  filter: brightness(0.94);
}
.htx-auth__submit:disabled {
  opacity: 0.7;
  cursor: default;
}

/* Enlaces secundarios */
.htx-auth__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.5rem;
  margin-top: 0.25rem;
}
.htx-auth__link {
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.htx-auth__link:hover {
  text-decoration: underline;
}

.htx-auth__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 9999px;
  animation: htx-auth-spin 0.6s linear infinite;
}
@keyframes htx-auth-spin {
  to { transform: rotate(360deg); }
}

/* Panel derecho */
.htx-auth__panel-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 3rem;
  color: #fff;
}
.htx-auth__panel-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}
.htx-auth__panel-tagline {
  margin: 1rem auto 0;
  max-width: 24rem;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
}
.htx-auth__blob {
  position: absolute;
  border-radius: 9999px;
}
.htx-auth__blob--tr {
  top: -6rem;
  right: -6rem;
  width: 24rem;
  height: 24rem;
  background: rgba(255, 255, 255, 0.1);
}
.htx-auth__blob--bl {
  bottom: -6rem;
  left: -4rem;
  width: 20rem;
  height: 20rem;
  background: rgba(255, 255, 255, 0.08);
}
</style>
