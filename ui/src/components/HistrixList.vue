<template>
<div>
  <div >
    <q-toolbar class="bg-primary text-white ">
      <q-toolbar-title><q-avatar  text-color="white" icon="rss_feed" />{{ schema.title}}</q-toolbar-title>
    </q-toolbar>
    <div v-if="schema.filters[0]" dense>
      <HistrixFilters dense :schema="schema" v-on:filter-data="getData(xmlUrl($event))"/>
    </div>
  </div>
  <div class="_q-pa-md q-gutter-md" outline >
    <q-list outline  bordered>
      <q-item v-for="(row, index) in data" v-bind:key="index" clickable @click="editItem(row)">
        <q-item-section v-for="(field, index) in row" v-bind:key="index">
          <q-item-label :innerHTML="field._">
            {{ field._ }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</div>
</template>

<script>
import useApi from '../services/histrixApi.js';
import { useHistrixI18n } from '../services/i18n.js';
import { useHistrixNotify } from '../services/notify.js';
import HistrixFilters from './HistrixFilters.vue';

export default {
  name: 'HistrixList',
  // select({ path, query }): el usuario eligió un renglón para editar.
  emits: ['select'],
  setup() {
    const { getAppData } = useApi();
    return { t: useHistrixI18n().t, notify: useHistrixNotify(), getAppData };
  },
  props: {
    path: null,
    schema: {},
    resources: {}
  },
  components: {
    HistrixFilters
  },
  mounted() {
    const url = this.xmlUrl();
    this.getData(url);
  },
  watch: {
    path(_newVal, _oldVal) {
      const url = this.xmlUrl();
      this.getData(url);
    }
  },
  computed: {
    visibleColumns() {
      return this.schema.columns
        .filter((column) => {
          return !column.hidden;
        })
        .map((column, _index, _array) => {
          return column.name;
        });
    },

    filteredData(_cols) {
      return this.data.filter((row) => {
        return !row.value;
      });
    }
  },
  methods: {
    xmlUrl(query) {
      return `${this.path}?${query || ''}&_dt=list`;
    },
    async deleteItem(item) {
      const index = this.data.indexOf(item);
      if (await this.notify.confirm(this.t('common.confirmDelete'))) {
        this.data.splice(index, 1);
      }
    },
    editItem(item) {
      this.editedIndex = this.data.indexOf(item);

      const item2 = {};
      let key;
      for (key in item) {
        item2[key] = item[key].value || item[key]._;
      }

      this.editedItem = Object.assign({}, item2);
      // La app decide cómo abrir la ficha (antes: push a una ruta `form` que no existía).
      this.$emit('select', { path: this.path, query: item2 });
    },
    close() {
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },
    getData(url) {
      this.getAppData(url)
        .then((response) => {
          this.data = response.data.data;
        })
        .catch((_e) => {
          this.dialog = true;
          this.message = this.t('common.loadError');
        });
    }
  },
  data() {
    return {
      message: null,
      dialog: false,
      mode: 'list',
      editedItem: [],
      dataContainer: null,
      data: [],
      pagination: {
        sortBy: 'desc',
        descending: false,
        page: 1,
        rowsPerPage: 10
        // rowsNumber: xx if getting data from a server
      }
    };
  }
};
</script>
