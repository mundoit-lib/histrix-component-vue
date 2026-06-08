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

        <!-- Estado: link expirado -->
        <div v-if="expired" class="htx-auth__sent">
          <p class="htx-auth__error">{{ expiredLabel }}</p>
          <router-link :to="forgotPasswordTo" class="htx-auth__link" :style="{ color: primaryColor }">
            {{ requestNewLabel }}
          </router-link>
        </div>

        <!-- Estado: éxito -->
        <div v-else-if="done" class="htx-auth__sent">
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

          <!-- Contraseña -->
          <div class="htx-auth__field-group">
            <label class="htx-auth__field">
              <svg class="htx-auth__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3"
                />
              </svg>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                autofocus
                :placeholder="passwordPlaceholder"
                class="htx-auth__input"
                :class="{ 'htx-auth__input--error': v$.password.$error }"
                @blur="v$.password.$touch()"
              />
              <button
                type="button"
                class="htx-auth__toggle"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <svg viewBox="0 0 24 24" class="htx-auth__toggle-icon" aria-hidden="true">
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
            <p v-if="v$.password.$error" class="htx-auth__field-error">{{ v$.password.$errors[0].$message }}</p>
          </div>

          <!-- Confirmar contraseña -->
          <div class="htx-auth__field-group">
            <label class="htx-auth__field">
              <svg class="htx-auth__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3"
                />
              </svg>
              <input
                v-model="confirm_password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :placeholder="confirmPasswordPlaceholder"
                class="htx-auth__input"
                :class="{ 'htx-auth__input--error': v$.confirm_password.$error }"
                @blur="v$.confirm_password.$touch()"
              />
            </label>
            <p v-if="v$.confirm_password.$error" class="htx-auth__field-error">
              {{ v$.confirm_password.$errors[0].$message }}
            </p>
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
import { helpers, minLength, required, sameAs } from '@vuelidate/validators';

import config from '../services/config.js';
import useApi from '../services/histrixApi.js';
import { shade } from '../utils/color.js';

export default {
  name: 'HistrixResetPasswordSplit',
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
    title: { type: String, default: 'Nueva contraseña' },
    subtitle: { type: String, default: 'Ingresá tu nueva contraseña.' },
    passwordPlaceholder: { type: String, default: 'Nueva contraseña' },
    confirmPasswordPlaceholder: { type: String, default: 'Repetir contraseña' },
    submitLabel: { type: String, default: 'Actualizar contraseña' },
    loadingLabel: { type: String, default: 'Actualizando…' },

    /** Enlace de vuelta al login. */
    loginLabel: { type: String, default: 'Ir al inicio de sesión' },
    loginTo: { type: [String, Object], default: () => ({ name: 'login' }) },
    /** Enlace para volver a pedir el mail de recupero (si el link expiró). */
    requestNewLabel: { type: String, default: 'Solicitar un nuevo enlace' },
    forgotPasswordTo: { type: [String, Object], default: () => ({ name: 'mail-reset-password' }) },
    expiredLabel: { type: String, default: 'El enlace de cambio de contraseña expiró.' },

    /**
     * token / email del usuario. Si quedan vacíos, se leen de la query de la
     * ruta (`?token=...&email=...`), que es lo que arma el link del mail.
     */
    token: { type: String, default: '' },
    email: { type: String, default: '' },
    /** URL incrustada en el mail (campo `recover`). */
    recoverUrl: { type: String, default: '' },
    /** Largo mínimo de contraseña. */
    passwordMinLength: { type: Number, default: 6 },

    /** Si true, prevalida el token (getValidToken) y muestra "link expirado". */
    validateToken: { type: Boolean, default: false },

    /** Muestra el selector de base de datos (busca las DB y configura la elegida). */
    showDatabase: { type: Boolean, default: false },
    /** Placeholder del selector de base de datos. */
    databasePlaceholder: { type: String, default: 'Seleccioná una base de datos' }
  },
  emits: ['success', 'error', 'db-change'],
  setup() {
    const { resetPassword, getValidToken, apiDBQuery, currentDb } = useApi();
    return { resetPassword, getValidToken, apiDBQuery, currentDb, v$: useVuelidate() };
  },
  data() {
    return {
      tokenValue: this.token,
      emailValue: this.email,
      password: '',
      confirm_password: '',
      showPassword: false,
      loading: false,
      done: false,
      expired: false,
      errorMsg: '',
      okMsg: '',
      db: '',
      databases: []
    };
  },
  validations() {
    return {
      password: {
        required: helpers.withMessage('Ingresá una contraseña.', required),
        minLength: helpers.withMessage(
          `Mínimo ${this.passwordMinLength} caracteres.`,
          minLength(this.passwordMinLength)
        )
      },
      confirm_password: {
        required: helpers.withMessage('Repetí la contraseña.', required),
        sameAsPassword: helpers.withMessage('Las contraseñas no coinciden.', sameAs(this.password))
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
  mounted() {
    // token/email desde props o desde la query del link del mail.
    const query = this.$route?.query || {};
    if (!this.tokenValue) this.tokenValue = query.token || '';
    if (!this.emailValue) this.emailValue = query.email || '';

    if (this.showDatabase) {
      this.apiDBQuery()
        .then((list) => {
          this.databases = list;
          const current = config.db;
          if (current && list.some((opt) => opt.value === current)) {
            this.db = current;
          }
        })
        .catch((e) => this.$emit('error', e));
    }

    if (this.validateToken && this.emailValue) {
      this.checkToken();
    }
  },
  watch: {
    db(newVal) {
      if (!newVal) return;
      config.db = newVal;
      localStorage.setItem('database', newVal);
      this.$emit('db-change', newVal);
    }
  },
  methods: {
    async checkToken() {
      try {
        const record = await this.getValidToken(this.emailValue);
        // Solo marcamos expirado si el backend devuelve un last_token distinto.
        if (record && record.last_token != null) {
          this.expired = String(record.last_token) !== String(this.tokenValue);
        }
      } catch (_e) {
        // Si no se puede validar, dejamos pasar el form (el backend rechaza al enviar).
      }
    },
    async onSubmit() {
      this.errorMsg = '';
      const valid = await this.v$.$validate();
      if (!valid) return;
      this.loading = true;
      const payload = {
        email: this.emailValue,
        password: this.password,
        confirm_password: this.confirm_password,
        token: this.tokenValue,
        recover: this.recoverUrl,
        db: this.currentDb()
      };
      try {
        const resp = await this.resetPassword(payload);
        this.okMsg = resp?.data?.responseText || 'Tu contraseña se actualizó correctamente.';
        this.done = true;
        this.$emit('success', { payload, response: resp });
      } catch (e) {
        this.errorMsg = e?.response?.data?.responseText || 'No se pudo actualizar la contraseña.';
        this.$emit('error', e);
      } finally {
        this.loading = false;
        this.password = '';
        this.confirm_password = '';
        this.v$.$reset();
      }
    }
  }
};
</script>

<style scoped>
/* Mismo lenguaje visual que el resto de la familia de auth. */
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
.htx-auth__toggle {
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
.htx-auth__toggle:hover {
  color: #6b7280;
}
.htx-auth__toggle-icon {
  width: 1.25rem;
  height: 1.25rem;
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
