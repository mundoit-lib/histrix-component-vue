<template>
  <div>
    <q-select map-options
     v-model="localValue" :options="dbinfo" v-bind="$attrs" :disabled="state == 'error'"
     />
    <q-banner dense inline-actions class="bg-red text-white" v-if="state == 'error'">
      {{message}}
    </q-banner>
    <q-banner dense inline-actions class="bg-green text-white" v-else>
      {{message}}
    </q-banner>
  </div>
</template>

<script>
import useApi from '../../services/histrixApi.js';
import { useHistrixI18n } from '../../services/i18n.js';

export default {
  name: 'DatabaseSelector',
  setup() {
    const { getHostDb } = useApi();
    return { t: useHistrixI18n().t, getHostDb };
  },
  props: {
    host: null,
    modelValue: {}
  },
  data() {
    return {
      dbinfo: [],
      state: 'success',
      message: this.t('database.connected')
    };
  },
  mounted() {
    this.getData(this.host);
  },
  computed: {
    localValue: {
      get() {
        return this.modelValue;
      },
      set(localValue) {
        this.$emit('update:modelValue', localValue.value);
      }
    }
  },
  emits: ['update:modelValue'],
  watch: {
    host(newVal, _oldVal) {
      this.getData(newVal);
    }
  },
  methods: {
    getData(host) {
      this.getHostDb(host)
        .then((response) => {
          const data = [];
          Object.entries(response.data)
            .filter((data) => data[1].hidden !== 'true')
            .map((info) => {
              data.push({
                value: info[1].id,
                label: info[1].description,
                description: info[1].name
              });
            });
          this.dbinfo = data;
          this.state = 'success';
          this.message = this.t('database.connected');
        })
        .catch((_e) => {
          this.state = 'error';
          this.message = this.t('database.unavailable');
        });
    }
  }
};
</script>
