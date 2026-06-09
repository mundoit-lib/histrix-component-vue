<template>
  <div>

    <q-expansion-item v-if="filterCount > 1" v-model="open" icon="search" :label="schema.title" caption="búsqueda avanzada" dense>
          <q-item v-for="field in filters" v-bind:key="field.uid" class=" col-xs-12 col-sm-6 col-md-6" dense>
            <HistrixField dense :model-value="field.valor" @update:model-value="onFilterUpdate(field, $event)" :schema="field" clearable  filled />
          </q-item>
    </q-expansion-item>

    <div v-if="filterCount == 1">
      <q-item v-for="field in filters" v-bind:key="field.uid" class=" col-xs-12 col-sm-6 col-md-6">

           <HistrixField :model-value="field.valor" @update:model-value="onFilterUpdate(field, $event)" :schema="field" clearable  filled/>


       </q-item>

    </div>
            <q-btn v-if="schema.filters[0] && !autoFilter" color="secondary" label="Buscar" icon="search" v-on:click="filterData" />
  </div>
</template>

<script>
import { buildFilterQuery } from '../core/filters.js';
import HistrixField from './HistrixField.vue';

export default {
  name: 'HistrixFilters',
  props: ['schema', 'show'],
  components: {
    HistrixField
  },
  mounted() {
    this.initFilters();
    this.open = this.show;
  },
  data() {
    return {
      filters: [],
      open: false
    };
  },
  computed: {
    filterCount() {
      return this.filters.length;
    },
    filterString() {
      return buildFilterQuery(this.filters);
    },
    autoFilter() {
      return this.schema.auto_filter === true;
    }
  },
  emits: ['filter-data'],
  methods: {
    filterData() {
      this.$emit('filter-data', this.filterString);
    },
    /**
     * Actualiza el valor del filtro y, si `auto_filter` está activo, dispara la
     * búsqueda automáticamente sin necesidad del botón "Buscar". Para inputs de
     * texto el evento ya viene con debounce 500ms desde HistrixField.
     */
    onFilterUpdate(field, value) {
      field.valor = value;
      if (this.autoFilter) {
        this.filterData();
      }
    },
    initFilters() {
      // filter local fields
      const filteredFilters = this.schema.filters.filter((e) => e.local !== 'true');
      const _customFields = [];

      this.filters = filteredFilters.map(function (f) {
        f.disabled = f.deshabilitado;
        f.readonly = f.deshabilitado;
        const item = this.schema.fields[f.id];
        const merged = { ...item, ...f };
        // El filtro nunca debe quedar vacío: si el backend no envía `valor`
        // se aplica el `default_option_value` del campo, replicando el
        // comportamiento del ERP legacy (y de HistrixForm.setDefaultValues).
        if (
          (merged.valor === '' || merged.valor == null) &&
          merged.default_option_value !== '' &&
          merged.default_option_value != null
        ) {
          merged.valor = merged.default_option_value;
        }
        return merged;
      }, this);
    }
  }
};
</script>
