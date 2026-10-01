<template>

      <div
        class="col q-pa-md
                 text-center "
      >
        <h5>{{ t('connection.title') }}</h5>
        <q-form @submit="save">
          <q-input
            v-model="host"
            class="q-mt-sm"
            :label="t('connection.path')"
            :hint="t('connection.pathHint')"
          ></q-input>

          <DatabaseSelector
            :host="host"
            :label="t('connection.database')"
            :model-value="database"
            @update:model-value="database = $event"
            :hint="t('connection.databaseHint')"
          />
          <br />

          <q-btn
            class="  bg-primary"
            text-color="white"
            icon="save"
            v-close-popup="3"
            type="submit"
            :label="t('common.save')"
          ></q-btn>
                    <q-btn
            flat
            text-color="primary"
            v-close-popup="3"

            :label="t('common.cancel')"
          ></q-btn>
        </q-form>
      </div>
  
</template>

<script>
import { useHistrixI18n } from '../../services/i18n.js';
import { useHistrixStorage } from '../../services/storage.js';

export default {
  name: 'HistrixConnectionSettings',
  setup() {
    return { t: useHistrixI18n().t, storage: useHistrixStorage() };
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
