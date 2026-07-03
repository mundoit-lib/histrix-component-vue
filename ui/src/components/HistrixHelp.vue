<template>
  <q-card class="histrix-help" style="min-width: 460px; max-width: 92vw">
    <q-card-section class="q-pb-xs">
      <div class="text-subtitle2 q-mb-xs">{{ title }}</div>
      <q-input
        v-model="search"
        dense
        clearable
        outlined
        debounce="400"
        type="search"
        placeholder="Buscar..."
        @update:model-value="loadData"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-table
        :rows="rows"
        :columns="columns"
        :loading="loading"
        row-key="__rowid"
        dense
        flat
        :pagination="pagination"
        :hide-bottom="rows.length <= pagination.rowsPerPage"
        @row-click="onRowClick"
      >
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="bg-primary text-white">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template v-slot:no-data>
          <div class="full-width text-center text-grey q-pa-sm">
            {{ loading ? 'Buscando...' : 'Sin resultados' }}
          </div>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script>
import { joinDirXml, parseHelpDetail, parseSchemaUri } from '../core/schemaUri.js';
import { compactValues, omit, pick } from '../core/values.js';
import useApi from '../services/histrixApi.js';

/**
 * Popup de ayuda (picker) para un campo con `helpContainer`.
 *
 * Modelo nuevo (ayudas stateless en JSON), usando la forma ESTRUCTURADA del
 * helpContainer (con fallback a parsear los strings uri/dataUri):
 *  - COLUMNAS: OPTIONS (schema) de la ayuda (`xml` + `dir`).
 *  - DATOS: GET a `parent` (xml+dir) con `__help = help_field`, `term` (lo tipeado)
 *    y los `context_fields` del form que tengan valor.
 *
 * Al elegir una fila, el relleno del form sale de `DT_RowAttr.data-helpdetail`
 * (mapa exacto campo→valor que da el backend). Se emite en `select-row` con la
 * misma forma que consume HistrixField.selectRow.
 */
export default {
  name: 'HistrixHelp',
  props: {
    helpContainer: { type: Object, required: true },
    // Estado actual del form (localValues). Se manda completo en cada búsqueda.
    formValues: { type: Object, default: () => ({}) },
    label: { type: String, default: '' },
    // Término de búsqueda vivo: lo maneja el campo padre (typeahead). Cada cambio
    // recarga la lista (con debounce). El buscador interno del popup lo refleja.
    term: { type: [String, Number], default: '' }
  },
  emits: ['select-row'],
  setup() {
    const { getAppSchema, getAppData } = useApi();
    return { getAppSchema, getAppData };
  },
  data() {
    return {
      search: '',
      columns: [],
      rows: [],
      loading: false,
      delayTimer: 0,
      pagination: { rowsPerPage: 8 }
    };
  },
  computed: {
    title() {
      return this.label ? `Seleccione ${this.label}` : 'Seleccione';
    },
    columnsSource() {
      // Preferimos la forma estructurada (xml + dir de la ayuda) en vez de parsear
      // el string `uri`; caemos a parsear `uri` sólo si no viene estructurada.
      const help = this.helpContainer;
      if (help.xml) {
        return { path: joinDirXml(help.dir, help.xml), params: {} };
      }
      return parseSchemaUri(help.uri);
    },
    dataSource() {
      // Forma estructurada: path desde `parent` (xml+dir) y `__help` desde
      // `help_field`. Es más robusto que parsear el string `dataUri`. Fallback:
      // `dataUri`, y si tampoco está (ayuda no migrada) la propia ayuda (`uri`).
      const help = this.helpContainer;
      if (help.parent?.xml) {
        const params = {};
        if (help.help_field) {
          params.__help = help.help_field;
        }
        return { path: joinDirXml(help.parent.dir, help.parent.xml), params };
      }
      return parseSchemaUri(help.dataUri || help.uri);
    },
    /**
     * values del form desnormalizados a escalares (las celdas pueden venir como
     * { value } o { _ }); axios no serializa objetos como query params.
     */
    cleanFormValues() {
      return this.flatten(this.formValues);
    }
  },
  methods: {
    flatten(obj) {
      const out = {};
      for (const key in obj) {
        if (key === 'DT_RowAttr') {
          continue;
        }
        const value = obj[key];
        if (value !== null && typeof value === 'object') {
          out[key] = value.value !== undefined ? value.value : value._ !== undefined ? value._ : '';
        } else {
          out[key] = value;
        }
      }
      return out;
    },
    loadColumns() {
      const { path } = this.columnsSource;
      if (!path) {
        return;
      }
      this.getAppSchema(path)
        .then((response) => {
          const fields = response.data?.schema?.fields || {};
          const columns = [];
          for (const name in fields) {
            const field = fields[name];
            if (field.hidden_column) {
              continue;
            }
            columns.push({
              name,
              label: field.title || name,
              field: name,
              align: field.align || 'left',
              sortable: true
            });
          }
          this.columns = columns;
        })
        .catch(() => {
          // Sin columnas: la tabla queda vacía; no rompemos el popup.
        });
    },
    loadData() {
      const { path, params } = this.dataSource;
      if (!path) {
        return;
      }
      this.loading = true;
      // Sólo se mandan los campos de contexto que pide el backend (context_fields)
      // y únicamente si tienen valor. Fallback (schema viejo sin context_fields):
      // todos los values no vacíos menos el propio campo de la ayuda (que ya viaja
      // en __help). En ambos casos `term` es el texto de búsqueda y va siempre.
      const help = this.helpContainer;
      let values;
      if (Array.isArray(help.context_fields)) {
        values = compactValues(pick(this.cleanFormValues, help.context_fields));
      } else {
        const helpField = params.__help || help.help_field;
        values = omit(compactValues(this.cleanFormValues), helpField);
      }
      // params (__help, etc.) van después para que ningún value los pise.
      const query = { ...values, ...params, term: this.search ?? '' };
      this.getAppData(path, query)
        .then((response) => {
          const data = response.data?.data || [];
          // Preservamos data-helpdetail: el backend indica ahí, por fila, EXACTAMENTE
          // qué campos del form rellenar (con su nombre destino). Lo usamos al elegir.
          this.rows = data.map((row, index) => ({
            ...this.flatten(row),
            __rowid: index,
            __helpdetail: row.DT_RowAttr?.['data-helpdetail'] ?? null
          }));
          this.loading = false;
          // Si hay exactamente un resultado lo autoseleccionamos: no tiene sentido
          // mostrar una lista de uno para que el usuario lo clickee.
          if (this.rows.length === 1) {
            this.pick(this.rows[0]);
          }
        })
        .catch(() => {
          this.rows = [];
          this.loading = false;
        });
    },
    pick(row) {
      // Preferimos el mapa exacto que da el backend (data-helpdetail): campos a
      // rellenar con su nombre destino, sin ensuciar el form con columnas de más.
      // Fallback (sin data-helpdetail): las columnas de la fila, sin internos.
      const fill = row.__helpdetail ? parseHelpDetail(row.__helpdetail) : omit(row, '__rowid', '__helpdetail');
      this.$emit('select-row', { row: fill });
    },
    onRowClick(_evt, row) {
      this.pick(row);
    }
  },
  watch: {
    // El padre (campo) actualiza `term` a medida que se tipea: sincronizamos el
    // buscador interno y recargamos, con debounce para no pegar en cada tecla.
    term(newVal) {
      const next = newVal != null ? String(newVal) : '';
      if (next === this.search) {
        return;
      }
      this.search = next;
      clearTimeout(this.delayTimer);
      this.delayTimer = setTimeout(() => this.loadData(), 350);
    }
  },
  mounted() {
    this.search = this.term != null ? String(this.term) : '';
    this.loadColumns();
    this.loadData();
  }
};
</script>
