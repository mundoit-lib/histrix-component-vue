<template>
  <div class="histrix-filters full-width" @histrix-clear="onClearKey">

    <!-- Búsqueda avanzada: varios filtros dentro de un acordeón -->
    <template v-if="filterCount > 1">
      <q-expansion-item
        v-model="open"
        icon="search"
        :label="schema.title"
        caption="búsqueda avanzada"
        dense
        class="histrix-filters__panel"
      >
        <div class="histrix-filters__body q-pa-md">
          <div class="row q-col-gutter-sm">
            <div
              v-for="field in filters"
              v-bind:key="field.uid"
              class="col-xs-12 col-sm-6"
            >
              <HistrixField
                class="full-width"
                dense
                :model-value="field.valor"
                @update:model-value="onFilterUpdate(field, $event)"
                :schema="field"
                clearable
                filled
              />
            </div>
          </div>
          <div
            v-if="schema.filters[0] && !autoFilter"
            class="row justify-end q-mt-md"
          >
            <q-btn
              class="histrix-filters__btn"
              color="secondary"
              label="Buscar"
              icon="search"
              unelevated
              no-caps
              v-on:click="filterData"
            />
          </div>
        </div>
      </q-expansion-item>
    </template>

    <!-- Filtro único: campo + botón en línea (desktop) / apilados (celular) -->
    <div
      v-else-if="filterCount == 1"
      class="row items-center"
      style="gap: 8px;"
    >
      <div
        v-for="field in filters"
        v-bind:key="field.uid"
        class="col-xs-12 col-sm-auto"
      >
        <HistrixField
          class="full-width"
          :model-value="field.valor"
          @update:model-value="onFilterUpdate(field, $event)"
          :schema="field"
          clearable
          filled
        />
      </div>
      <div v-if="schema.filters[0] && !autoFilter" class="col-xs-12 col-sm-auto">
        <q-btn
          class="histrix-filters__btn full-width"
          color="secondary"
          label="Buscar"
          icon="search"
          v-on:click="filterData"
        />
      </div>
    </div>
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
    /**
     * F4 con el foco en un filtro (atajo de HistrixApp): limpia los filtros
     * editables, como el legacy. No dispara la búsqueda.
     */
    onClearKey(event) {
      event.stopPropagation();
      event.preventDefault();
      this.clearFilters();
    },
    clearFilters() {
      for (const field of this.filters) {
        // `deshabilitado` viaja como string del XML: 'true' | 'false' | ''.
        if (field.deshabilitado !== 'true' && field.deshabilitado !== true) {
          field.valor = '';
        }
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

<style scoped>
/* Panel de búsqueda avanzada: contenedor con borde suave para que la zona
   expandida (campos + botón Buscar) se distinga del resto de la barra. */
.histrix-filters__panel {
  border: 1px solid #e3e7ee;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

/* En desktop fijamos un ancho estable para que el panel NO salte de tamaño
   entre cerrado y abierto: el acordeón solo crece hacia abajo. En celular
   ocupa todo el ancho disponible. */
@media (min-width: 600px) {
  .histrix-filters__panel {
    width: 480px;
    max-width: 100%;
  }
}

/* Cuerpo desplegable: separado del header por una línea tenue */
.histrix-filters__body {
  border-top: 1px solid #f0f2f5;
  background: #fcfcfd;
}

.histrix-filters__btn {
  border-radius: 8px;
  font-weight: 600;
  padding: 0 18px;
}
</style>
