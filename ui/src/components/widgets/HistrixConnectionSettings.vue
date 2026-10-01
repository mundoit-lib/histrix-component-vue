<template>

      <div
        class="col q-pa-md
                 text-center "
      >
        <h5>Datos de Conexión</h5>
        <q-form @submit="save">
          <q-input
            v-model="host"
            class="q-mt-sm"
            label="Ruta de su Histrix"
            hint="Indique la Ruta al servidor Histrix. Ej: http://localhost/"
          ></q-input>

          <DatabaseSelector
            :host="host"
            label="Base de datos"
            :model-value="database"
            @update:model-value="database = $event"
            hint="Base de Datos por defecto"
          />
          <br />

          <q-btn
            class="  bg-primary"
            text-color="white"
            icon="save"
            v-close-popup="3"
            type="submit"
            :label="'Guardar'"
          ></q-btn>
                    <q-btn
            flat
            text-color="primary"
            v-close-popup="3"

            label="Cancelar"
          ></q-btn>
        </q-form>
      </div>
  
</template>

<script>
import { useHistrixStorage } from '../../services/storage.js';

export default {
  name: 'HistrixConnectionSettings',
  setup() {
    return { storage: useHistrixStorage() };
  },
  data() {
    return {
      host: null,
      database: null
    };
  },
  mounted() {
    this.host = this.storage.get('host');
    this.database = this.storage.get('database');
  },
  methods: {
    async save() {
      this.storage.set('host', this.host);
      this.storage.set('database', this.database);
      this.$emit('change-database');
    }
  },
  emits: ['change-database']
};
</script>
