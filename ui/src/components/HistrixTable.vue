<template>
  <div class="histrix-table">
    <HistrixApp
      v-if="schema.header"
      :path="headerPath"
      :query="this.$route.query"
      :title="this.title"
      class="col"
    />

    <!-- Form del renglón arriba de la grilla (formMode inline/vertical):
         siempre visible, como el `ing` del legacy. -->
    <q-card v-if="inlineForm" flat bordered class="histrix-row-form q-mb-sm">
      <HistrixForm ref="histrixForm" v-bind="{ ...$attrs, ...rowFormProps }" v-on="rowFormListeners" />
    </q-card>

    <q-table
      v-bind="tableDateProp"
      :columns="schema.columns"
      v-model:pagination="pagination"
      :_grid="mode == 'grid'"
      :grid="$q.screen.lt.sm"
      flat
      dense
      :filter="filter"
      :loading="loading"
      :visible-columns="visibleColumns"
      row-key="_id"
      class=" fit"
      v-model:expanded="expanded"
      :hide-bottom="data.length > 0"
      :_hide-top="data.length < pagination.rowsPerPage"
      v-on:closepopup="closePopup"
      @update:pagination="updatePagination"
      @request="onRequest"
    >
      <!-- TOP LEFT: FILTERS -->
      <template v-slot:top-left="">
        <!-- Los filtros se muestran siempre que el schema los traiga, incluso en
             modo inner (grid embebido con filtros propios). El título y el buscador
             siguen siendo sólo para página completa (!inner). -->
        <div v-if="!inner || schema.filters.length" class="row full-width items-center q-gutter-y-xs">
          <HistrixFilters
            v-if="schema.filters.length"
            class="col-xs-12 col-sm-auto"
            dense
            :schema="schema"
            v-on:filter-data="histrixFilter"
            :show="openFilter"
          />
          <q-item v-else-if="!inner" _class="text-body1">
            {{ schema.title }}
          </q-item>
          <q-input
            v-if="search && !inner"
            class="col-xs-12 col-sm-auto"
            v-model="searchStr"
            type="search"
            dense
            :label="t('common.search')"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </template>

      <!-- TOP right: BUTTONS -->
      <template v-slot:top-right="props">
        <div v-if="paginationConfig.enabled && data.length" class="histrix-pagination">
          <div class="histrix-pagination__size">
            <span class="histrix-pagination__label">{{ t('table.perPage') }}</span>
            <q-select
              :options="paginationOptions"
              hide-bottom-space
              dense
              borderless
              item-aligned
              emit-value
              map-options
              :model-value="pagination.rowsPerPage"
              @update:model-value="setRowsPerPage"
              class="histrix-pagination__select"
            />
          </div>
          <span class="histrix-pagination__range">{{ paginationLabel }}</span>
          <div class="histrix-pagination__nav">
            <q-btn
              v-if="props.pagesNumber > 2"
              icon="first_page"
              color="grey-8"
              round
              dense
              flat
              :disable="props.isFirstPage"
              @click="props.firstPage"
            />
            <q-btn
              icon="chevron_left"
              color="grey-8"
              round
              dense
              flat
              :disable="props.isFirstPage"
              @click="props.prevPage"
            />
            <q-btn
              icon="chevron_right"
              color="grey-8"
              round
              dense
              flat
              :disable="props.isLastPage"
              @click="props.nextPage"
            />
            <q-btn
              v-if="props.pagesNumber > 2"
              icon="last_page"
              color="grey-8"
              round
              dense
              flat
              :disable="props.isLastPage"
              @click="props.lastPage"
            />
          </div>
        </div>
        <q-btn-group dense flat v-if="!inner">
          <q-btn
            v-if="schema.export"
            flat
            icon="get_app"
            _icon="fas fa-file-excel"
            :title="t('common.export')"
            @click="$emit('export', fullQuery)"
          />
          <q-btn flat icon="print" :title="t('common.print')" @click="$emit('print')" />
          <!--  <q-btn flat round dense :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'" @click="props.toggleFullscreen" />  -->
          <!--
          <q-btn flat  :icon="mode === 'grid' ? 'list' : 'grid_on'" @click=" mode = mode === 'grid' ? 'list' : 'grid'; separator = mode === 'grid' ? 'none' : 'horizontal';" >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup>{{
              mode === "grid" ? "List" : "Grid"
            }}</q-tooltip>
          </q-btn>
          -->
        </q-btn-group>

        <q-btn
          fab
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          class="histrix-add-btn"
          color="positive"
          icon="add"
          :title="t('common.new')"
          v-if="showAddButton"
          @click="addItem()"
          no-caps
        >
        </q-btn>
      </template>

      <!-- TABLE HEADER -->

      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width class="bg-primary" v-if="schema.inline_detail"
            >1</q-th
          >
          <q-th
            auto-width
            v-if="showActions"
            class="bg-primary text-white"
          ></q-th>

          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            :style="
              schema.fields[col.name]['column_style'] + ';text-align:center;'
            "
          >
            <!-- <HistrixField standout dense class="bg-grey text-white" v-model="field.valor" :schema="schema.fields[col.name]" clearable  /> -->
            <q-checkbox
              v-if="isHeaderCheck(col)"
              dense
              size="xs"
              :model-value="columnCheckState(col.name)"
              :title="t('table.checkAll')"
              @click.stop
              @update:model-value="toggleColumn(col.name, $event === true)"
            />
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <!--- TABLE BODY -->
      <template v-slot:body="props">
        <q-tr :props="props" @click="selectRow(props, $event)" :class="rowClass(props)">
          <q-td style="width:10px;" v-if="schema.inline_detail">
            <q-btn
              v-if="hasDetail(props)"
              size="xs"
              color="accent"
              dense
              @click="props.expand = !props.expand"
              :icon="props.expand ? 'remove' : 'add'"
            />
          </q-td>
          <q-td
            key="actions"
            v-if="showActions"
            class="action-cell"
          >
            <q-btn
              flat
              rounded
              icon="edit"
              v-if="showEditButton"
              color="positive"
              :title="t('table.editRow')"
              @click.stop="editRow(props.row)"
              size="sm"
              no-caps
            />
            <q-btn
              flat
              unelevated
              rounded
              icon="delete"
              v-if="showDeleteButton"
              color="secondary"
              :title="t('table.deleteRow')"
              @click.stop="deleteItem(props.row)"
              size="sm"
              no-caps
            />
            <q-btn
              flat
              rounded
              icon="save"
              v-if="liveSaveRow"
              color="positive"
              :disable="!dirtyRows[props.key]"
              :title="t('table.saveRow')"
              @click.stop="saveLiveRow(props.key)"
              size="sm"
              no-caps
            />
          </q-td>

          <q-td
            v-for="cell in props.cols.filter((row) => row.name)"
            :key="cell.name"
            :props="props"
            :style="colStyle(cell)"
            class="histrix-cell"
          >
            <HistrixField
              :model-value="rawRow(props.key)[cell.name]"
              @update:model-value="setCell(props.key, cell.name, $event)"
              :row="rawRow(props.key)"
              :query="fieldQuerys(cell.name, rawRow(props.key))"
              :name="cell.name"
              :schema="schema.fields[cell.name]"
              :rowSchema="getRowSchema(props.key, cell.name)"
              dense
              hide-bottom-space
              v-on:field-change="rowChange"
              v-if="
                getFieldAttribute(props.key, cell.name, 'editable') && isGrid
              "
            />
            <HistrixCell
              v-else
              :path="path"
              :props="props"
              :schema="schema.fields[cell.name]"
              :col="cell"
              v-on:open-popup="bubbleLink(rawRow(props.key), $event)"
              v-on:closepopup="closePopup"
            />
          </q-td>
        </q-tr>
        <q-tr v-if="props.expand" :props="props">
          <q-td colspan="100%" class="bg-grey-12 qa-pa-xs">
            <HistrixApp
              name="detail"
              inner="true"
              :path="detailPath(props)"
              :query="detailQuery(props)"
            />
          </q-td>
        </q-tr>
      </template>

      <!-- grid mode (celular): cada fila es una tarjeta compacta -->
      <template v-slot:item="props">
        <div :class="gridCellClasses(props)">
          <component
            v-bind:is="contentItem"
            flat
            :class="'histrix-grid-card' + (props.selected ? ' histrix-grid-card--selected' : '')"
          >
            <div class="histrix-grid-body">
              <template
                v-for="(cell, idx) in props.cols.filter((row) => row.name)"
                :key="cell.name"
              >
                <div
                  v-if="
                    idx === 0 ||
                    (getFieldAttribute(props.key, cell.name, 'editable') && isGrid) ||
                    (rawRow(props.key)[cell.name] != null && rawRow(props.key)[cell.name] !== '')
                  "
                  :class="idx === 0 ? 'histrix-grid-title' : 'histrix-grid-line'"
                >
                  <span
                    v-if="idx !== 0 && cell.label && !(getFieldAttribute(props.key, cell.name, 'editable') && isGrid)"
                    class="histrix-grid-label"
                  >
                    {{ cell.label }}
                  </span>
                  <span class="histrix-grid-value">
                    <HistrixField
                      :model-value="rawRow(props.key)[cell.name]"
                      @update:model-value="setCell(props.key, cell.name, $event)"
                      :row="rawRow(props.key)"
                      :query="fieldQuerys(cell.name, rawRow(props.key))"
                      :name="cell.name"
                      :schema="schema.fields[cell.name]"
                      :rowSchema="getRowSchema(props.key, cell.name)"
                      dense
                      v-if="getFieldAttribute(props.key, cell.name, 'editable') && isGrid"
                    />
                    <HistrixCell
                      v-else
                      :path="path"
                      :props="props"
                      :schema="schema.fields[cell.name]"
                      :col="cell"
                      v-on:open-popup="bubbleLink(rawRow(props.key), $event)"
                      v-on:closepopup="closePopup"
                    />
                  </span>
                </div>
              </template>
            </div>

            <template
              v-if="showActions || hasDetail(props)"
            >
              <q-separator class="histrix-grid-sep" />
              <div class="histrix-grid-actions">
                <q-btn
                  flat
                  dense
                  icon="edit"
                  :label="t('table.edit')"
                  v-if="showEditButton"
                  color="positive"
                  @click="editRow(props.row)"
                  size="sm"
                  no-caps
                />
                <q-btn
                  flat
                  dense
                  icon="delete"
                  :label="t('table.delete')"
                  v-if="showDeleteButton"
                  color="secondary"
                  @click="deleteItem(props.row)"
                  size="sm"
                  no-caps
                />
                <q-btn
                  flat
                  dense
                  icon="save"
                  :label="t('common.save')"
                  v-if="liveSaveRow"
                  color="positive"
                  :disable="!dirtyRows[props.key]"
                  @click="saveLiveRow(props.key)"
                  size="sm"
                  no-caps
                />
                <q-btn
                  flat
                  dense
                  color="accent"
                  v-if="hasDetail(props)"
                  @click="props.expand = !props.expand"
                  :icon="props.expand ? 'remove' : 'add'"
                  :label="props.expand ? t('common.close') : t('table.detail')"
                  size="sm"
                  no-caps
                />
              </div>
            </template>
            <div v-if="props.expand" class="histrix-grid-detail">
              <HistrixApp
                name="detail"
                inner="true"
                :path="detailPath(props)"
                :query="detailQuery(props)"
              />
            </div>
          </component>
        </div>
      </template>

      <template v-slot:bottom-row="props">
        <q-tr :props="props" v-if="data.length > 0">
          <q-th auto-width v-if="schema.inline_detail"> </q-th>
          <q-th
            auto-width
            v-if="showActions"
            class="bg-primary text-white"
          ></q-th>

          <q-th
            v-for="col in props.cols.filter((col) => col.name !== 'desc')"
            :key="col.name"
            :class="col.classes + ' text-bold'"
            style="text-align:right;"
          >
            <span v-if="isSumColumn(col) && columnTotals[col.name]">
              {{ formatCell(col, columnTotals[col.name]) }}
            </span>
          </q-th>
        </q-tr>
      </template>

      <!--
      <template v-slot:bottom="props">
        <q-btn v-if="schema.insertButton" fab icon="add" color="red" :title="t('table.add')" @click="insertRow()"></q-btn>
          <q-page-sticky position="bottom-right" :offset="[18, 18]">
            <q-btn fab icon="add" color="red" :title="t('table.add')" @onclick="newItem()"></q-btn>}
          </q-page-sticky>
      </template>
      -->
    </q-table>

    <q-dialog v-model="dialog" position="top">
      <q-card style="auto">
        <q-card-section class="row items-center ">
          <div>
            <div class="text-weight-bold">{{ message }}</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-if="!inlineForm" v-model="edit" ref="formDialog" full-width @update:model-value="showDialog">
      <q-card @keydown="onDialogKeydown">
        <HistrixForm ref="histrixForm" v-bind="{ ...$attrs, ...rowFormProps }" v-on="rowFormListeners" />
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { buildFieldQueries } from '../core/fieldQueries.js';
import { resolveFieldKind } from '../core/fieldType.js';
import { visibleColumnNames } from '../core/fieldVisibility.js';
import { evaluateFormula } from '../core/formula.js';
import {
  columnTotals,
  headerCheckState,
  isSumColumn,
  nextOrden,
  nextRowId,
  removeRow,
  rowIndexById,
  setCellValue,
  setColumnChecked,
  upsertRow
} from '../core/gridRows.js';
import { resolveAction } from '../core/hotkeys.js';
import { keyFieldNames } from '../core/keys.js';
import { normalizeScreenType } from '../core/normalize.js';
import { formatNumber, isNumericField, numericSpec } from '../core/numeric.js';
import { buildPageParams, parsePageResponse } from '../core/pagination.js';
import useApi from '../services/histrixApi.js';
import { useHistrixI18n } from '../services/i18n.js';
import { useHistrixNotify } from '../services/notify.js';
import HistrixApp from './HistrixApp.vue';
import HistrixCell from './HistrixCell.vue';
import HistrixField from './HistrixField.vue';
import HistrixFilters from './HistrixFilters.vue';
import HistrixForm from './HistrixForm.vue';

/** Cómo se muestra el form del renglón en las grillas de carga (`ing`/`grid`). */
const FORM_MODES = ['dialog', 'inline', 'vertical'];

export default {
  name: 'HistrixTable',
  setup() {
    const { updateAppData, processApp, deleteAppData, getAppData } = useApi();
    return { t: useHistrixI18n().t, notify: useHistrixNotify(), updateAppData, processApp, deleteAppData, getAppData };
  },
  props: {
    inner: { type: Boolean, default: false },
    path: String,
    query: Object,
    schema: { type: Object, required: true },
    resources: Object,
    valueFilter: { type: String, required: false },
    title: String,
    search: { type: Boolean, default: false },
    computedFields: Object,
    computedTotals: Object,
    modelValue: null,
    isFormulation: { type: Boolean, default: false },
    /**
     * Form del renglón en `ing`/`grid`: 'dialog' (modal, default), 'inline'
     * (arriba de la grilla, siempre visible) o 'vertical' (inline, un campo
     * por línea). El backend todavía no serializa `hideForm`/`subtipo`, así
     * que lo elige la app.
     */
    formMode: { type: String, default: 'dialog', validator: (v) => FORM_MODES.includes(v) },
    /** Enter en el último campo del form confirma el renglón (flujo del legacy). */
    enterConfirmsRow: { type: Boolean, default: true },
    /**
     * liveGrid: guardar cada fila con su botón en vez de al editar la celda
     * (`saveRowButton` del XML, que el backend todavía no serializa).
     */
    saveRowButton: { type: Boolean, default: false }
  },
  inject: {
    // Lo provee HistrixApp (prop `keyboard`). Fuera de una app, activo.
    histrixKeyboard: { default: () => () => true }
  },
  components: {
    HistrixFilters,
    HistrixField,
    HistrixForm,
    HistrixCell,
    HistrixApp
  },
  mounted() {
    this.editedItem = Object.assign({}, this.schema.values);
    // Paginación inicial desde el schema: deshabilitada → mostrar todo
    // (rowsPerPage 0); habilitada → arrancar con el page_size del backend.
    this.pagination.rowsPerPage = this.paginationConfig.enabled ? this.paginationConfig.pageSize : 0;
    if (this.serverSide) {
      // rowsNumber presente = q-table en modo server: no ordena ni pagina en
      // memoria y emite @request ante cada cambio de página/orden.
      this.pagination.rowsNumber = 0;
      this.pagination.sortBy = null;
    }
    /*
    if (this.modelValue) {
      this.data = JSON.parse(JSON.stringify(this.modelValue))
    } else {
      this.data = []
    }
    */
    if (this.inlineForm && this.canEditRows) {
      this.insertRow();
    }
    if (this.schema.preFetch === true /* && this.data.length == 0 */) {
      this.getData();
    } else {
      // Sin preFetch no hay carga automática al montar: apagamos el "Cargando..."
      // para no dejar la tabla colgada. Si más tarde carga (filtro aplicado o el
      // padre pasa la relación), getData vuelve a encender el loading.
      this.loading = false;
      // Open filter
      if (!this.data.length) {
        this.openFilter = true;
      }
    }
  },
  watch: {
    // Al cambiar el tamaño de página volvemos a la primera, para que el rango
    // ("1-50 de N") y la vista de la q-table queden siempre consistentes.
    'pagination.rowsPerPage'() {
      this.pagination.page = 1;
    },
    path: {
      handler(_newVal, _oldVal) {
        // Cambió el XML (nueva pantalla): re-aplicamos la regla de preFetch del
        // nuevo schema. Reseteamos el "armado" para no arrastrar el de la anterior.
        this.autoFetchArmed = false;
        this.pagination.page = 1;
        if (this.autoFetchAllowed) {
          this.getData();
        }
      }
    },
    query: {
      // NO se filtra por preFetch a propósito: este watcher es data-driven (p. ej.
      // un grid interno que carga cuando el padre le pasa la clave de relación) y
      // ya tiene su propio guard por contenido. Sólo dispara ante un cambio real.
      handler(newVal, oldVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.pagination.page = 1;
          this.getData();
        }
      }
    },
    fullQuery: {
      handler(_newVal, _oldVal) {
        this.pagination.page = 1;
        if (this.autoFetchAllowed) {
          this.getData();
        }
      }
    },
    innerData: {
      handler() {
        this.$emit('update:modelValue', this.rawData);
      },
      deep: true
    },
    // Totales hacia la cabecera (`computedTotals`): se recalculan al
    // confirmar, modificar o borrar un renglón, incluso si quedan en 0.
    columnTotals(totals) {
      for (const [target, source] of Object.entries(this.computedTotals || {})) {
        this.$emit('computed-total', { target, value: totals[source] });
      }
    }
  },
  computed: {
    /**
     * Configuración de paginación provista por el backend (`schema.pagination`).
     * Defaults conservadores si el schema no la trae: habilitada, 50 por página,
     * sin tope. `max_limit` acota el default y las opciones del selector.
     */
    paginationConfig() {
      const p = this.schema.pagination || {};
      const maxLimit = Number(p.max_limit) || 0;
      let pageSize = Number(p.page_size) || 50;
      if (maxLimit && pageSize > maxLimit) {
        pageSize = maxLimit;
      }
      return { enabled: p.enabled !== false, pageSize, maxLimit };
    },
    /**
     * Paginación contra el backend: sólo con `schema.pagination` habilitada y
     * fuera de las grillas de carga (`ing`/`grid`/`liveGrid`), que acumulan
     * renglones cliente-side y viajan juntos en el process.
     */
    serverSide() {
      return this.paginationConfig.enabled && !this.isGrid && this.screenType !== 'ing';
    },
    /**
     * Opciones del selector "Por página": valores estándar + `page_size`,
     * descartando los que superen `max_limit` (que además se agrega como tope).
     * "Todos" (0) se mantiene siempre.
     */
    paginationOptions() {
      const { maxLimit, pageSize } = this.paginationConfig;
      const values = [5, 10, 15, 20, 25, 50, 100, 200, pageSize].filter((v) => v > 0 && (!maxLimit || v <= maxLimit));
      if (maxLimit && !values.includes(maxLimit)) {
        values.push(maxLimit);
      }
      const unique = [...new Set(values)].sort((a, b) => a - b);
      const options = unique.map((v) => ({ label: String(v), value: v }));
      options.push({ label: this.t('table.all'), value: 0 });
      return options;
    },
    /**
     * Rango + total de registros para el paginador superior ("1-50 de 82").
     * Server-side el total viene del backend (`pageTotal`; null = desconocido,
     * se muestra "de 50+"); client-side es `data.length`.
     */
    paginationLabel() {
      if (this.serverSide) {
        const count = this.data.length;
        if (count === 0) {
          return '0 de 0';
        }
        const rpp = this.pagination.rowsPerPage;
        const start = rpp ? (this.pagination.page - 1) * rpp + 1 : 1;
        const end = start + count - 1;
        return this.pageTotal === null ? `${start}-${end} de ${end}+` : `${start}-${end} de ${this.pageTotal}`;
      }
      const total = this.data.length;
      if (total === 0) {
        return '0 de 0';
      }
      const rpp = this.pagination.rowsPerPage;
      if (!rpp) {
        return `1-${total} de ${total}`;
      }
      const start = (this.pagination.page - 1) * rpp + 1;
      const end = Math.min(this.pagination.page * rpp, total);
      return `${start}-${end} de ${total}`;
    },
    contentItem() {
      return this.isFormulation ? 'div' : 'q-card';
    },
    headerPath() {
      if (this.schema.header) {
        const path = `${this.schema.header.dir}/${this.schema.header.xml}`;
        /*
        if (link.dir == null) {
          path = `/${this.dirname(this.path)}/${link.file}`;
        }
        */
        const finalLink = `${path}`;
        return finalLink.replace('//', '/');
      }
      return false;
    },
    innerData() {
      if (this.filteredRows) {
        return this.filteredRows.map((row) => {
          const newRow = row;
          // calculate fields in row
          if (this.computedFields !== undefined) {
            for (const formula in this.computedFields) {
              const result = this.processOperation(this.computedFields[formula], newRow);
              if (result !== undefined) {
                if (
                  row[formula] !== undefined &&
                  (typeof row[formula] === 'object' || typeof row[formula] === 'function')
                ) {
                  newRow[formula].value = result;
                } else {
                  newRow[formula] = result;
                }
              }
            }
          }

          return newRow;
        });
      }
    },
    tableDateProp() {
      return {
        rows: this.innerData
      };
    },
    rawData() {
      return this.innerData.map((row) => {
        const newRow = {};
        for (const item in row) {
          if (row[item] !== undefined && (typeof row[item] === 'object' || typeof row[item] === 'function')) {
            newRow[item] = row[item].value !== undefined ? row[item].value : row[item]._;
          } else {
            newRow[item] = row[item];
          }
        }
        return newRow;
      });
    },

    /**
     * Totales al pie de las columnas `suma="true"` sobre las filas cargadas (la
     * página visible si la paginación es server-side: el backend no manda
     * sumas). También se calculan las columnas origen de `computedTotals`.
     */
    columnTotals() {
      return columnTotals(this.data, this.schema.columns, this.computedTotals);
    },
    /** Filas de `data` por `_id` (row-key de la q-table), para las celdas. */
    dataById() {
      return new Map(this.data.map((row) => [row._id, row]));
    },
    /** Valores planos de las filas visibles por `_id`. */
    rawById() {
      return new Map(this.rawData.map((row) => [row._id, row]));
    },
    filteredRows() {
      if (!this.searchStr) {
        return this.data;
      }
      return this.data.filter((row) => {
        try {
          return (
            Object.keys(row)
              .map((key, index) => {
                try {
                  const value = row[key]._ || row[key].value || row[key];
                  if (typeof value !== 'string') {
                    return '';
                  }
                  return value.toLowerCase(); // Aquí puede fallar
                } catch (error) {
                  console.error(`Error en el índice ${index} con la clave "${key}":`, error);
                  return ''; // Retorna un string vacío para evitar que falle el `join()`
                }
              })
              .join()
              .indexOf(this.searchStr.toLowerCase()) > -1
          );
        } catch (error) {
          console.error('Error en la iteración de filter:', error);
          return false;
        }
      });
    },
    filteredData(_cols) {
      return this.data.filter((row) => !row.value);
    },
    screenType() {
      return normalizeScreenType(this.schema.type);
    },
    isGrid() {
      return this.screenType === 'grid' || this.screenType === 'livegrid';
    },
    /** Grilla de carga de renglones (detalle de comprobante, cliente-side). */
    isLoadGrid() {
      return this.screenType === 'ing' || this.screenType === 'grid';
    },
    /** Renglones modificables: alta, edición y borrado locales. */
    canEditRows() {
      return this.isLoadGrid && !this.schema.readonly;
    },
    inlineForm() {
      return this.isLoadGrid && this.formMode !== 'dialog';
    },
    liveSaveRow() {
      return this.screenType === 'livegrid' && this.saveRowButton;
    },
    showEditButton() {
      return (this.canUpdate && !this.isGrid) || this.canEditRows;
    },
    showDeleteButton() {
      return (this.schema.can_delete && this.canDelete) || this.canEditRows;
    },
    showActions() {
      return this.showEditButton || this.showDeleteButton || this.liveSaveRow;
    },
    showAddButton() {
      if (this.isLoadGrid) {
        // Con el form inline siempre visible no hace falta el botón.
        return this.canEditRows && !this.inlineForm && Boolean(this.schema.can_insert || this.schema.insertButton);
      }
      return this.schema.can_insert && this.canInsert;
    },
    /** Props del form del renglón (diálogo o inline). */
    rowFormProps() {
      return {
        resources: this.resources,
        schema: this.schema,
        path: this.path,
        query: this.query,
        editedItem: this.editedItem,
        editedIndex: this.editedIndex,
        editedRow: this.editedRow,
        inner: this.inner,
        computedFields: this.computedFields,
        newRecord: this.newRecord,
        enterSubmits: this.isLoadGrid && this.enterConfirmsRow,
        vertical: this.isLoadGrid && this.formMode === 'vertical'
      };
    },
    rowFormListeners() {
      return {
        'open-popup': (link) => this.bubbleLink(this.editedItem, link),
        'form-saved': this.formSaved,
        'insert-row': this.commitGridRow,
        closepopup: this.onRowFormClose,
        valueEdit: this.setEdit
      };
    },
    canInsert() {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      return this.resources.hasOwnProperty('POST');
    },
    canUpdate() {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      return this.resources.hasOwnProperty('PUT') && this.schema.can_update;
    },
    canDelete() {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      return this.resources.hasOwnProperty('DELETE');
    },
    onlyConsulta() {
      return !this.canInsert && !this.canUpdate && !this.canDelete;
    },
    /**
     * ¿Se permite la carga automática de datos contra la API?
     *
     * `preFetch` controla la carga automática INICIAL:
     *  - preFetch:true  → carga sola al abrir (y ante cambios de path/sort/etc.).
     *  - preFetch:false → NO pega a la API hasta que el usuario la "arma"
     *    (p. ej. aplica un filtro). Ej típico: un grid `ing`/`grid` de alta que
     *    arranca vacío y se completa cargando renglones a mano.
     *
     * Antes esto sólo se respetaba en mounted(); los watchers de path/fullQuery y
     * el update:pagination de la q-table llamaban getData() igual. Este gate lo
     * centraliza. (El watcher de `query` queda afuera a propósito: ver su nota.)
     */
    autoFetchAllowed() {
      return this.schema.preFetch === true || this.autoFetchArmed;
    },
    visibleColumns() {
      // Lógica pura extraída a ../core/fieldVisibility.js.
      return visibleColumnNames(this.schema.columns);
    },
    fieldsWithContainers() {
      return this.filterObject(this.schema.fields, (field) => !field.innerContainer && !field.options);
    },
    updatedFields() {
      return this.filterObject(this.schema.fields, (field) => !field.update_fields);
    }
  },
  emits: [
    'export',
    'print',
    'computed-total',
    'update:modelValue',
    'closepopup',
    'open-popup',
    'open-detail',
    'select-row',
    'edit-value'
  ],
  methods: {
    setEdit(value) {
      this.editValue = value;
      // Antes salía por el bus global (`editValue`) y le llegaba a todas las tablas.
      this.$emit('edit-value', value);
    },
    getRowSchema(key, cell) {
      return this.dataById.get(key)?.DT_RowAttr?.attributes?.[cell];
    },
    /** Valores planos de la fila `key` (`_id`), los que editan las celdas. */
    rawRow(key) {
      return this.rawById.get(key) || {};
    },
    /** Edición en celda: escribe en la copia plana y en `data` (fuente de verdad). */
    setCell(key, name, value) {
      this.rawRow(key)[name] = value;
      const row = this.dataById.get(key);
      if (row) {
        setCellValue(row, name, value);
      }
    },
    async showDialog() {
      let confim = true;
      if (this.editValue) {
        confim = await this.notify.confirm(this.t('table.closeUnsaved'));
      }
      if (!confim) {
        this.edit = true;
      } else {
        this.setEdit(false);
      }
    },
    closeEdit() {
      this.edit = false;
      this.editingId = null;
      this.setEdit(false);
    },
    /** Cancelar / cerrar el form: en modo inline vuelve a alta en vez de cerrar. */
    onRowFormClose() {
      if (this.inlineForm) {
        this.startNewRow();
        return;
      }
      this.closeEdit();
    },
    /** Form del renglón en alta, limpio y con el foco en el primer campo. */
    startNewRow() {
      this.insertRow();
      this.$nextTick(() => this.$refs.histrixForm?.startRow?.());
    },
    /**
     * Enter dentro del diálogo del renglón: el diálogo está teleportado fuera
     * de la HistrixApp, así que el atajo global no lo ve. Lo resolvemos acá.
     */
    onDialogKeydown(event) {
      if (!this.isLoadGrid || resolveAction(event, { enabled: this.histrixKeyboard() }) !== 'nextField') {
        return;
      }
      if (this.focusNextField(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    /** Enter en el form del renglón (lo llama HistrixApp desde el atajo). */
    focusNextField(target) {
      return this.$refs.histrixForm?.focusNextField?.(target) === true;
    },
    updatePagination(pagination) {
      // Server-side el cambio de página/orden llega por @request (onRequest).
      if (this.serverSide) {
        return;
      }
      const descending = pagination.descending ? 'desc' : 'asc';
      this.localFilters._sortBy = `${pagination.sortBy}|${descending}`;
      // La q-table emite update:pagination al montar; con preFetch:false eso NO
      // debe pegarle a la API. Guardamos el sort igual (por si después se carga).
      if (!this.autoFetchAllowed) {
        return;
      }
      this.getData();
    },
    /** @request de la q-table (modo server): guarda página/orden y pide la página. */
    onRequest({ pagination }) {
      this.pagination = { ...this.pagination, ...pagination };
      if (!this.autoFetchAllowed) {
        return;
      }
      this.getData();
    },
    setRowsPerPage(rowsPerPage) {
      if (this.serverSide) {
        this.onRequest({ pagination: { page: 1, rowsPerPage } });
        return;
      }
      this.pagination.rowsPerPage = rowsPerPage;
    },
    isSumColumn(col) {
      return isSumColumn(col);
    },
    /** Checkbox de cabecera: columnas check editables de grid/liveGrid. */
    isHeaderCheck(col) {
      const field = this.schema.fields[col.name];
      return Boolean(this.isGrid && field?.editable && resolveFieldKind(field) === 'check');
    },
    columnCheckState(name) {
      return headerCheckState(this.data, name);
    },
    /** Marca o desmarca la columna; en liveGrid guarda (o marca sucias) las filas que cambiaron. */
    toggleColumn(name, checked) {
      const changed = setColumnChecked(this.data, name, checked);
      if (this.screenType !== 'livegrid') {
        return;
      }
      for (const row of changed) {
        if (this.liveSaveRow) {
          this.dirtyRows[row._id] = true;
        } else {
          this.updateLiveRow(this.getValuesFromRow(row));
        }
      }
    },
    /** Formato de una celda numérica del pie: el de la columna si es numérica. */
    formatCell(col, value) {
      if (isNumericField(col)) {
        return formatNumber(value, numericSpec(col));
      }
      if (Number.isInteger(value)) {
        return String(value);
      }
      return Number(value).toLocaleString('es-AR', {
        style: 'decimal',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      });
    },
    /** Query del combo/ayuda de la celda, con los valores de su fila (incluye update_fields). */
    fieldQuerys(fieldname, row) {
      return buildFieldQueries(this.schema.fields, row, this.query)[fieldname] || {};
    },
    bubbleLink(row, link) {
      link.row = row;
      this.$emit('open-popup', link);
    },
    closePopup() {
      this.$emit('closepopup');
    },
    refresh() {
      this.getData();
    },
    rowChange(row) {
      if (this.screenType !== 'livegrid') {
        return;
      }
      if (this.liveSaveRow) {
        this.dirtyRows[row._id] = true;
      } else {
        this.updateLiveRow(row);
      }
    },
    /** liveGrid con `saveRowButton`: guarda la fila con su botón. */
    async saveLiveRow(key) {
      if (await this.updateLiveRow(this.rawRow(key))) {
        delete this.dirtyRows[key];
      }
    },

    getFieldAttribute(key, name, attr) {
      const value = this.dataById.get(key)?.DT_RowAttr?.attributes?.[name]?.[attr];
      if (value !== undefined) {
        return value;
      }
      return this.schema.fields[name][attr];
    },
    colStyle(col) {
      const style = col.value?.style ? col.value.style : '';
      return `${style};`;
    },
    processOperation(str, row) {
      // Evaluador aritmético seguro (core/formula.js). El getValue desnormaliza
      // las celdas-objeto de la tabla (extrae `.value`/`._`) antes de calcular.
      return evaluateFormula(str, (k) => {
        const cell = row[k];
        if (cell && (typeof cell === 'object' || typeof cell === 'function')) {
          return cell.value !== undefined ? cell.value : cell._;
        }
        return cell;
      });
    },
    insertRow() {
      const item = JSON.parse(JSON.stringify(this.schema.values || {}));

      item._id = nextRowId(this.data);
      item._ajax_ = false;
      // _ORDEN se numera cliente-side. En Histrix normal el servidor hace el +1
      // por cada renglón; acá el grid es cliente-side (los renglones se acumulan
      // y viajan juntos en el process), así que la librería asigna el correlativo.
      if (Object.prototype.hasOwnProperty.call(item, '_ORDEN')) {
        item._ORDEN = nextOrden(this.data);
      }
      this.editedIndex = item._id;
      this.editedItem = item;
      this.editedRow = {};
      this.editingId = null;
      // Fila nueva del grid: el form muestra Grabar y confirma un alta.
      this.newRecord = true;
      if (!this.inlineForm) {
        this.edit = true;
      }
    },
    /** Guarda una fila de liveGrid. Devuelve true si el backend la aceptó. */
    updateLiveRow(row) {
      const postData = {
        keys: this.getKeys(row),
        data: this.getValuesFromRow(row)
      };
      return this.updateAppData(this.xmlUrl(), postData)
        .then((_response) => {
          this.notify.success(this.t('table.rowSaved'));
          return true;
        })
        .catch((e) => {
          this.notify.error(e);
          return false;
        });
    },
    formSaved(_row, index) {
      // update row values

      if (this.data[index]) {
        this.getData(index);
      } else {
        this.getData();
      }
      this.edit = false;
    },
    commitGridRow(row, editedIndex) {
      // Renglón confirmado de un grid "ing"/"grid": se acumula cliente-side en
      // this.data (sin pegarle a la API). El watcher de innerData emite
      // update:modelValue hacia el grid padre, que junta los renglones para que
      // viajen en el process del comprobante.
      const item = JSON.parse(JSON.stringify(row));
      if (item._id === undefined) {
        item._id = editedIndex && typeof editedIndex === 'object' ? editedIndex._id : editedIndex;
      }
      if (item._id === undefined || item._id === null) {
        item._id = nextRowId(this.data);
      }
      const previous = this.data[rowIndexById(this.data, item._id)];
      if (previous) {
        // Modificación: conserva los atributos de la fila que no pasan por el form.
        for (const attr of ['DT_RowAttr', '_ajax_']) {
          if (previous[attr] !== undefined && item[attr] === undefined) {
            item[attr] = previous[attr];
          }
        }
      } else if (Object.prototype.hasOwnProperty.call(item, '_ORDEN')) {
        // Alta: el _ORDEN se toma al confirmar, por si se borró algo mientras tanto.
        item._ORDEN = nextOrden(this.data);
      }
      const { isNew } = upsertRow(this.data, item);
      this.setEdit(false);
      if (!this.canEditRows) {
        this.edit = false;
        return;
      }
      // Como el legacy: después de un alta el form queda listo para el
      // siguiente renglón; después de una modificación vuelve a alta (inline)
      // o se cierra (diálogo).
      if (this.inlineForm || isNew) {
        this.startNewRow();
      } else {
        this.closeEdit();
      }
    },
    processData() {
      this.submitting = true;
      this.processApp(this.xmlUrl(), this.rawData)
        .then((_response) => {
          this.submitting = false;
          this.$emit('closepopup');
          this.refresh();
        })
        .catch((_e) => {
          this.submitting = false;
        });
    },
    selectRow(props, event) {
      const { row } = props;
      // Grilla de carga: click en el renglón lo carga en el form para
      // modificarlo (H.llenoForm), salvo que se haga click en una celda editable.
      if (this.canEditRows) {
        if (!event?.target?.closest?.('input, textarea, select, button, .q-field, .q-checkbox')) {
          this.editRow(row);
        }
        return;
      }
      if (this.hasDetail(props)) {
        const rowAttr = row.DT_RowAttr;
        this.$emit('open-detail', rowAttr);
      } else {
        this.$emit('select-row', {
          row: this.getValuesFromRow(row),
          schema: this.schema
        });
      }
    },
    detailPath(props) {
      const { row } = props;
      const rowAttr = row.DT_RowAttr;
      return rowAttr.detailpath;
    },
    detailQuery(props) {
      const { row } = props;
      const rowAttr = row.DT_RowAttr;
      return new URLSearchParams(rowAttr.detailquery);
    },

    hasDetail(props) {
      const { row } = props;
      if (row.DT_RowAttr) {
        const attr = row.DT_RowAttr;
        // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
        return attr.hasOwnProperty('detailpath');
      }
      return false;
    },
    rowClass(props) {
      const { row } = props;
      let rowclass = '';
      if (row.DT_RowAttr) {
        const attr = row.DT_RowAttr;
        rowclass = attr.DT_RowClass || '';
      }

      if (this.hasDetail(props) || this.onlyConsulta || this.canEditRows) {
        rowclass += ' cursor-pointer ';
      }
      if (this.canEditRows && this.editingId !== null && row._id === this.editingId) {
        rowclass += ' histrix-row--editing ';
      }

      return rowclass;
    },
    gridCellClasses(props) {
      // En modo grid (celular) NO propagamos DT_RowClass: esa clase la genera el
      // ERP legacy para filas <tr> de DataTables (alto mínimo de fila + un
      // border-left de color) y al aplicarla al wrapper de la tarjeta la estiraba
      // y dejaba un hueco vacío. La tarjeta controla su propio layout; solo
      // conservamos el cursor-pointer cuando la fila abre detalle o es de consulta.
      let cls = 'histrix-grid-cell col-12';
      if (this.hasDetail(props) || this.onlyConsulta) {
        cls += ' cursor-pointer';
      }
      return cls;
    },
    xmlUrl(filterQuery) {
      return `${this.path}?&_dt=table${filterQuery}`;
    },
    async deleteItem(item) {
      if (this.canEditRows) {
        this.deleteGridRow(item);
        return;
      }
      if (await this.notify.confirm(this.t('common.confirmDelete'))) {
        this.delete(item);
      }
    },
    /** Borra un renglón de la grilla de carga (H.deleterow) y renumera _ORDEN. */
    async deleteGridRow(row) {
      if (!(await this.notify.confirm(this.t('table.confirmDeleteRow')))) {
        return;
      }
      removeRow(this.data, row._id);
      if (this.editingId === row._id) {
        // Se borró el renglón que estaba en el form: vuelve a alta.
        if (this.inlineForm) {
          this.startNewRow();
        } else {
          this.closeEdit();
        }
      }
    },
    getKeys(item) {
      // El valor de cada clave puede venir envuelto en `._` (formato XML del backend).
      const keyData = {};
      for (const name of keyFieldNames(this.schema.fields)) {
        keyData[name] = item[name]._ ? item[name]._ : item[name];
      }
      return keyData;
    },
    removeItem(item) {
      const index = this.data.indexOf(item);
      this.data.splice(index, 1);
    },
    delete(item) {
      if (item._ajax_ === false) {
        this.removeItem(item);
      } else {
        if (this.getKeys(item).length !== 0) {
          this.deleteAppData(this.xmlUrl(), this.getKeys(item))
            .then((_response) => {
              this.removeItem(item);
              this.refresh();
            })
            .catch((e) => {
              console.error(e);
            });
        }
      }
    },

    getValuesFromRow(row) {
      const item2 = {};
      let key;
      for (key in row) {
        if (row[key] !== undefined && (typeof row[key] === 'object' || typeof row[key] === 'function')) {
          item2[key] = row[key].value !== undefined ? row[key].value : row[key]._;
        } else {
          item2[key] = row[key];
        }
      }
      return item2;
    },
    addItem() {
      if (this.isLoadGrid) {
        this.startNewRow();
        this.insertButton = true;
        return;
      }
      this.editedIndex = -1;
      this.newRecord = true;
      this.editedItem = JSON.parse(JSON.stringify(this.schema.values));
      this.insertButton = true;
      this.edit = true;
    },
    editRow(row) {
      if (this.canEditRows) {
        this.editGridRow(row);
        return;
      }
      // this.editedIndex = this.data.indexOf(row);
      this.editedIndex = row;
      this.newRecord = false;
      this.editedRow = row;
      this.editedItem = Object.assign({}, this.getValuesFromRow(row));

      this.edit = true;
    },
    /**
     * Modificar un renglón confirmado (H.llenoForm): lo carga en el form; al
     * confirmar, commitGridRow lo reemplaza por su `_id`.
     */
    editGridRow(row) {
      this.editingId = row._id;
      this.editedIndex = row._id;
      this.editedRow = row;
      this.newRecord = false;
      this.editedItem = this.getValuesFromRow(row);
      if (this.inlineForm) {
        this.$nextTick(() => this.$refs.histrixForm?.startRow?.());
      } else {
        this.edit = true;
      }
    },
    close() {
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },
    histrixFilter($query) {
      // El usuario aplicó un filtro: a partir de acá el grid puede cargar aunque
      // el schema tenga preFetch:false. El watcher de fullQuery hace el getData.
      this.autoFetchArmed = true;
      this.fullQuery = $query;
    },
    filterObject(obj, predicate) {
      const result = {};
      let key;
      for (key in obj) {
        // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
        if (obj.hasOwnProperty(key) && !predicate(obj[key])) {
          result[key] = obj[key];
        }
      }
      return result;
    },
    getData(index) {
      this.loading = true;
      const url = this.xmlUrl(this.fullQuery);
      const pageParams = this.serverSide ? buildPageParams(this.pagination, this.paginationConfig) : {};
      const filters = { ...this.query, ...this.localFilters, ...pageParams };

      this.getAppData(url, filters)
        .then((response) => {
          let { data } = response.data;
          if (this.serverSide) {
            const limit = pageParams.page_size || 0;
            const offset = limit ? (pageParams.page - 1) * limit : 0;
            const page = parsePageResponse(response.data, { offset, limit });
            data = page.rows;
            this.pageTotal = page.total;
            // Total desconocido: una fila "fantasma" de más habilita "siguiente".
            this.pagination.rowsNumber = page.total ?? offset + data.length + (page.hasMore ? 1 : 0);
          }
          data.map((element) => {
            if (element.DT_RowAttr) {
              element._id = element.DT_RowAttr.o;
            }
          });
          if (index) {
            this.data[index] = data[index];
          } else {
            this.data = data;
          }

          this.loading = false;
          this.openFilter = false;
        })
        .catch((_e) => {
          this.dialog = true;
          this.message = this.t('common.loadError');
          this.loading = false;
        });
    }
  },
  data() {
    return {
      localFilters: {
        _sortBy: ''
      },
      edit: false,
      editValue: false,
      filter: '',
      fullQuery: this.query,
      expanded: [],
      loading: true,
      message: null,
      dialog: false,
      mode: 'list',
      editedItem: {},
      editedRow: {},
      editedIndex: undefined,
      newRecord: false,
      editingId: null, // _id del renglón cargado en el form para modificar
      dirtyRows: {}, // liveGrid con saveRowButton: filas editadas sin guardar
      defaultItem: {},
      dataContainer: null,
      data: [],
      openFilter: false,
      autoFetchArmed: false, // el usuario ya "armó" la carga (aplicó filtro, etc.)
      pageTotal: null, // total de registros informado por el backend (server-side)
      searchStr: this.modelValueFilter,
      pagination: {
        sortBy: 'desc',
        descending: false,
        page: 1,
        rowsPerPage: 50
        // rowsNumber: xx if getting data from a server
      }
    };
  }
};
</script>
<style>
/* Renglón cargado en el form para modificar. */
.histrix-row--editing td {
  background: rgba(25, 118, 210, 0.08);
}

.histrix-cell {
  max-width: 200px;
}

.q-table td,
.q-table th {
  /* don't shorten cell contents */
  white-space: normal;
}

.action-cell {
  white-space: nowrap !important ;
}

/* ===========================================================================
   Vista móvil (modo grid de QTable, < 600px) — lista de tarjetas
   Reglas namespaceadas bajo .histrix-table para no afectar otras tablas.
   =========================================================================== */

/* --- Área del grid: fondo tenue para que las tarjetas "floten" --- */
.histrix-table .q-table__grid-content {
  background: #eef1f5;
  padding: 12px 12px 4px;
  align-content: flex-start;
  align-items: flex-start;
}

/* Cada celda del grid envuelve una tarjeta. Reset defensivo: ningún alto ni
   borde impuesto desde fuera (Quasar o estilos heredados) puede estirar la
   tarjeta. El DT_RowClass del ERP legacy ya no se propaga aquí (ver
   gridCellClasses), por eso desaparece la franja de color y el hueco vacío. */
.histrix-table .histrix-grid-cell {
  align-self: flex-start !important;
  min-height: 0 !important;
  height: auto !important;
  padding: 0 !important;
}

/* --- Tarjeta: contenedor flex, borde y sombra suaves --- */
.histrix-table .histrix-grid-card {
  display: flex;
  flex-direction: column;
  min-height: 0 !important;
  height: auto !important;
  width: 100%;
  background: #fff;
  border: 1px solid #e3e7ee;
  border-radius: 14px;
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.06),
    0 1px 3px rgba(16, 24, 40, 0.05);
  margin-bottom: 12px;
  overflow: hidden;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.histrix-table .histrix-grid-card--selected {
  border-color: var(--q-primary, #1976d2);
  box-shadow: 0 0 0 2px var(--q-primary, #1976d2);
}

/* --- Cuerpo: pila de campos --- */
.histrix-table .histrix-grid-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

/* Título: la primera columna, destacada como nombre de la tarjeta */
.histrix-table .histrix-grid-title {
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.3;
  color: #101828;
  word-break: break-word;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.histrix-table .histrix-grid-title .histrix-grid-value {
  text-align: left;
  font-weight: 700;
}

/* Resto de campos: etiqueta a la izquierda, valor a la derecha */
.histrix-table .histrix-grid-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 14px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.histrix-table .histrix-grid-label {
  flex: 0 0 auto;
  max-width: 45%;
  color: #667085;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.histrix-table .histrix-grid-value {
  flex: 1 1 auto;
  min-width: 0;
  text-align: right;
  word-break: break-word;
  color: #1d2939;
  font-weight: 500;
}

/* Sin etiqueta: el valor se alinea a la izquierda */
.histrix-table .histrix-grid-line .histrix-grid-value:only-child {
  text-align: left;
}

/* --- Acciones: barra inferior con buen tamaño táctil --- */
.histrix-table .histrix-grid-sep {
  margin: 0;
}

.histrix-table .histrix-grid-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 10px;
  background: #f9fafb;
}

.histrix-table .histrix-grid-actions .q-btn {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 600;
  padding: 0 12px;
}

/* --- Detalle expandido dentro de la tarjeta --- */
.histrix-table .histrix-grid-detail {
  background: #f7f8fa;
  padding: 8px;
  border-top: 1px solid #eceef2;
}

/* ===========================================================================
   Paginación (label + selector + flechas) — barra superior derecha
   =========================================================================== */
.histrix-table .histrix-pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.histrix-table .histrix-pagination__size {
  display: flex;
  align-items: center;
  gap: 4px;
}

.histrix-table .histrix-pagination__label {
  font-size: 0.8rem;
  color: #667085;
  white-space: nowrap;
}

/* Rango + total de registros ("1-50 de 82") */
.histrix-table .histrix-pagination__range {
  font-size: 0.8rem;
  color: #667085;
  white-space: nowrap;
}

.histrix-table .histrix-pagination__select {
  min-width: 56px;
}

.histrix-table .histrix-pagination__nav {
  display: flex;
  align-items: center;
}

/* --- Barra superior: apilar y full-width en celular --- */
@media (max-width: 599px) {
  .histrix-table .q-table__top {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px;
  }

  /* Cada control (top-left / top-right) ocupa todo el ancho */
  .histrix-table .q-table__top .q-table__control {
    width: 100%;
  }

  /* El separador flexible no aporta nada al apilar en columna */
  .histrix-table .q-table__top .q-table__separator {
    display: none;
  }

  /* Top-right: paginación + acciones se distribuyen y envuelven */
  .histrix-table .q-table__top .q-table__control:last-child {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px 8px;
  }

  /* Selector "Por página" + flechas: label/selector a un lado, flechas al otro */
  .histrix-table .histrix-pagination {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
