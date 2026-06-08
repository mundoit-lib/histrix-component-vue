<template>
  <q-card style="width: 700px; max-width: 80vw;">
    <q-card-section class="bg-primary text-white">
      <h2 class="text-h6 q-ma-xs">Modificar Contraseña</h2>
    </q-card-section>
    <q-card-section>
      <q-form _v-if="!okPassword" @submit.prevent="submit">
        <q-list _class="row">
          <q-item class="col-12   q-pa-sm">
            <q-item-section>
              <q-input label="Contraseña Actual" id="password" filled required type="password"
                v-model="form.old_password" name="password" :before="[{ icon: 'lock' }]"
                :error="v$.form.old_password.$error" />
            </q-item-section>
          </q-item>

          <q-item class="col-12   q-pa-sm">
            <q-item-section>

              <InputPasswordVue :labelShow="'wer'" :model-value="form.new_password"
                @update:model-value="form.new_password = $event" placeholder="Ingrese su nueva contraseña"
                :toggle="true" required @score="showScore" class="full-width" :error-label="passwordErrorMsg">
              </InputPasswordVue>
            </q-item-section>
          </q-item>
          <q-item class="col-12   q-pa-sm">
            <q-item-section>

              <InputPasswordVue :labelShow="'wer'" :model-value="form.confirm_password"
                @update:model-value="form.confirm_password = $event" placeholder="Repita su nueva contraseña"
                :toggle="true" required @score="showScore" class="full-width" :error-label="passwordErrorMsg">
              </InputPasswordVue>
            </q-item-section>
          </q-item>

          <br>
          <div class="col-xs-12 q-mb-sm text-center">
            <q-btn icon="chevron_right" class="q-pl-md q-pr-md q-pt-sm q-pb-sm full-width" :disable="btnLoading"
              type="submit" :loading="btnLoading" color="primary" size="md" label="Modificar">
            </q-btn>

          </div>

        </q-list>
      </q-form>
    </q-card-section>
  </q-card>
</template>
<script>
import { useVuelidate } from '@vuelidate/core';
import { minLength, required, sameAs } from '@vuelidate/validators';
import config from '../services/config.js';
import useApi from '../services/histrixApi.js';
import InputPasswordVue from './InputPassword.vue';

export default {
  name: 'HistrixPasswordChange',
  components: {
    InputPasswordVue
  },
  props: {
    closable: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { changePassword } = useApi();
    return { v$: useVuelidate(), changePassword };
  },
  data: () => ({
    user: '',
    btnLoading: false,
    form: {
      user_id: null,
      old_password: null,
      new_password: null,
      confirm_password: null,
      db: config.db
    },
    loading: true
  }),
  validations() {
    return {
      form: {
        old_password: { required },
        new_password: { required, minLength: minLength(6) },
        confirm_password: { required, sameAsPassword: sameAs('new_password') }
      }
    };
  },
  computed: {
    passwordErrorMsg() {
      if (this.form.old_password === '') {
        return '';
      }
      return 'Ingrese contraseña correcta';
    },
    passwordError() {
      return this.v$.form.old_password.$error;
    }
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.form.user_id = this.user.user_id;
  },
  methods: {
    showScore(_score) {
      // Hook intencionalmente vacío; se sobreescribe donde se necesite mostrar el score.
    },
    validateForm() {
      return this.form.new_password === this.form.confirm_password;
    },
    submit() {
      if (!this.validateForm()) {
        return;
      }
      this.btnLoading = true;
      const _redirect = this.$auth.redirect();

      this.changePassword(this.form)
        .then((resp) => {
          this.response = resp.data.responseText;
          this.form.old_password = null;
          this.form.new_password = null;
          this.form.confirm_password = null;
          this.okPassword = resp.data.responseText;
          this.$q.notify({
            message: resp.data.responseText,
            type: 'positive',
            timeout: 8000,
            position: 'top'
          });
          this.$emit('close');
        })
        .catch((error) => {
          const resp = error.response.data.responseText || 'Ha ocurrido un error reseteando contraseña';
          this.$q.notify({
            message: resp,
            type: 'negative',
            timeout: 8000,
            position: 'top'
          });
          this.btnLoading = false;
        });
    }
  },
  emits: ['close']
};
</script>
<style scoped>
.Password {
  max-width: 100%;
}
</style>
