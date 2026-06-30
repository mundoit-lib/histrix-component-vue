<template>
  <div class="histrix-table">
    <HistrixApp
      v-if="schema.header"
      :path="headerPath"
      :query="this.$route.query"
      :title="this.title"
      class="col"
    />

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
      :hide-bottom="data.length < pagination.rowsPerPage"
      :_hide-top="data.length < pagination.rowsPerPage"
      v-on:closepopup="closePopup"
      @update:pagination="updatePagination"
    >
      <!-- TOP LEFT: FILTERS -->
      <template v-slot:top-left="">
        <div v-if="!inner" class="row full-width items-center q-gutter-y-xs">
          <HistrixFilters
            v-if="schema.filters.length"
            class="col-xs-12 col-sm-auto"
            dense
            :schema="schema"
            v-on:filter-data="histrixFilter"
            :show="openFilter"
          />
          <q-item v-else _class="text-body1">
            {{ schema.title }}
          </q-item>
          <q-input
            v-if="search"
            class="col-xs-12 col-sm-auto"
            v-model="searchStr"
            type="search"
            dense
            label="Buscar"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </template>

      <!-- TOP right: BUTTONS -->
      <template v-slot:top-right="props">
        <div v-if="data.length > 50" class="histrix-pagination">
          <div class="histrix-pagination__size">
            <span class="histrix-pagination__label">Por página</span>
            <q-select
              :options="optionsPagination"
              hide-bottom-space
              dense
              borderless
              item-aligned
              emit-value
              map-options
              v-model="pagination.rowsPerPage"
              class="histrix-pagination__select"
            />
          </div>
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
            title="Exportar"
            @click="$emit('export', fullQuery)"
          />
          <q-btn flat icon="print" title="Imprimir" @click="$emit('print')" />
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
          title="Nuevo"
          v-if="schema.can_insert && canInsert"
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
            v-if="(canUpdate && !isGrid) || (schema.can_delete && canDelete)"
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
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <!--- TABLE BODY -->
      <template v-slot:body="props">
        <q-tr :props="props" @click="selectRow(props)" :class="rowClass(props)">
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
            v-if="(canUpdate && !isGrid) || (schema.can_delete && canDelete)"
            class="action-cell"
          >
            <q-btn
              flat
              rounded
              icon="edit"
              v-if="canUpdate && !isGrid"
              color="positive"
              @click="editRow(props.row)"
              size="sm"
              no-caps
            />
            <q-btn
              flat
              unelevated
              rounded
              icon="delete"
              v-if="schema.can_delete && canDelete"
              color="secondary"
              @click="deleteItem(props.row)"
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
              :model-value="rawData[props.key][cell.name]"
              @update:model-value="rawData[props.key][cell.name] = $event"
              :row="rawData[props.key]"
              :query="fieldQuerys(cell.name, rawData[props.key])"
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
              v-on:open-popup="bubbleLink(rawData[props.key], $event)"
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
                    (rawData[props.key][cell.name] != null && rawData[props.key][cell.name] !== '')
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
                      :model-value="rawData[props.key][cell.name]"
                      @update:model-value="rawData[props.key][cell.name] = $event"
                      :row="rawData[props.key]"
                      :query="fieldQuerys(cell.name, rawData[props.key])"
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
                      v-on:open-popup="bubbleLink(rawData[props.key], $event)"
                      v-on:closepopup="closePopup"
                    />
                  </span>
                </div>
              </template>
            </div>

            <template
              v-if="(canUpdate && !isGrid) || (schema.can_delete && canDelete) || hasDetail(props)"
            >
              <q-separator class="histrix-grid-sep" />
              <div class="histrix-grid-actions">
                <q-btn
                  flat
                  dense
                  icon="edit"
                  label="Editar"
                  v-if="canUpdate && !isGrid"
                  color="positive"
                  @click="editRow(props.row)"
                  size="sm"
                  no-caps
                />
                <q-btn
                  flat
                  dense
                  icon="delete"
                  label="Borrar"
                  v-if="schema.can_delete && canDelete"
                  color="secondary"
                  @click="deleteItem(props.row)"
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
                  :label="props.expand ? 'Cerrar' : 'Detalle'"
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
            v-if="(canUpdate && !isGrid) || (schema.can_delete && canDelete)"
            class="bg-primary text-white"
          ></q-th>

          <q-th
            v-for="col in props.cols.filter((col) => col.name !== 'desc')"
            :key="col.name"
            :class="col.classes + ' text-bold'"
            style="text-align:right;"
          >
          <span v-if="columnTotals[col.name]">
            <span v-if="!Number.isInteger(columnTotals[col.name]) ">
              {{
                columnTotals[col.name].toLocaleString('es-AR', {
                  style: 'decimal',
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })
              }}
            </span>
            <span v-if="Number.isInteger(columnTotals[col.name])">
              {{columnTotals[col.name]}}
            </span>
          </span>
          </q-th>
        </q-tr>
      </template>

      <!--
      <template v-slot:bottom="props">
        <q-btn v-if="schema.insertButton" fab icon="add" color="red" title="agregar" @click="insertRow()"></q-btn>
          <q-page-sticky position="bottom-right" :offset="[18, 18]">
            <q-btn fab icon="add" color="red" title="agregar" @onclick="newItem()"></q-btn>}
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

    <q-dialog v-model="edit" ref="formDialog" full-width @update:model-value="showDialog">
      <q-card>
        <HistrixForm
          ref="histrixForm"
          :resources="resources"
          :schema="schema"
          :path="path"
          :query="query"
          v-bind="$attrs"
          :editedItem="editedItem"
          :editedIndex="editedIndex"
          :editedRow="editedRow"
          :inner="inner"
          v-on:open-popup="bubbleLink(editedItem, $event)"
          v-on:form-saved="formSaved"
          v-on:insert-row="commitGridRow"
          v-on:closepopup="closeEdit"
          v-on:valueEdit="setEdit"
          :computedFields="computedFields"
          :newRecord="newRecord"
        />
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { visibleColumnNames } from '../core/fieldVisibility.js';
import { evaluateFormula } from '../core/formula.js';
import { keyFieldNames } from '../core/keys.js';
import useApi from '../services/histrixApi.js';
import HistrixApp from './HistrixApp.vue';
import HistrixCell from './HistrixCell.vue';
import HistrixField from './HistrixField.vue';
import HistrixFilters from './HistrixFilters.vue';
import HistrixForm from './HistrixForm.vue';

export default {
  name: 'HistrixTable',
  setup() {
    const { updateAppData, processApp, deleteAppData, getAppData } = useApi();
    return { updateAppData, processApp, deleteAppData, getAppData };
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
    isFormulation: { type: Boolean, default: false }
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
    /*
    if (this.modelValue) {
      this.data = JSON.parse(JSON.stringify(this.modelValue))
    } else {
      this.data = []
    }
    */
    if (this.schema.preFetch === true /* && this.data.length == 0 */) {
      this.getData();
    } else {
      // Open filter
      if (!this.data.length) {
        this.openFilter = true;
      }
    }
  },
  watch: {
    path: {
      handler(_newVal, _oldVal) {
        this.getData();
      }
    },
    query: {
      handler(newVal, oldVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.getData();
        }
      }
    },
    fullQuery: {
      handler(_newVal, _oldVal) {
        this.getData();
      }
    },
    innerData: {
      handler() {
        this.$emit('update:modelValue', this.rawData);
      },
      deep: true
    }
  },
  computed: {
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

    /** Calculates the bottom amount where field has sum = true */
    columnTotals() {
      const totals = {};
      const columnsToSum = this.schema.columns.filter((col) => col.sum !== null);
      for (const element of columnsToSum) {
        totals[element.name] = this.data.reduce((prev, cur) => {
          const field = cur[element.name];
          const value = field?.value ?? field?._ ?? field ?? 0;
          return prev + (Number.parseFloat(value) || 0);
        }, 0);
      }
      Object.keys(this.computedTotals).map((key) => {
        const sourceName = this.computedTotals[key];
        this.$emit('computed-total', {
          target: key,
          value: totals[sourceName]
        });
      });
      return totals;
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
    isGrid() {
      return this.schema.type === 'grid' || this.schema.type === 'liveGrid';
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
  emits: ['export', 'print', 'computed-total', 'update:modelValue', 'closepopup', 'open-popup', 'select-row'],
  methods: {
    setEdit(value) {
      this.editValue = value;
      this.$events.fire('editValue', value);
    },
    getRowSchema(index, cell) {
      if (this.data[index].DT_RowAttr.attributes) {
        return this.data[index].DT_RowAttr.attributes[cell];
      }
      [];
    },
    showDialog() {
      // eslint-disable-next-line no-alert
      let confim = true;
      if (this.editValue) {
        confim = window.confirm('Usted esta por cerrar el formulario. Recuerde guardar la informacion o se perdera');
      }
      if (!confim) {
        this.edit = true;
      } else {
        this.setEdit(false);
      }
    },
    closeEdit() {
      this.edit = false;
      this.setEdit(false);
    },
    updatePagination(pagination) {
      const descending = pagination.descending ? 'desc' : 'asc';
      this.localFilters._sortBy = `${pagination.sortBy}|${descending}`;
      this.getData();
    },
    fieldQuerys(fieldname, row) {
      const fieldQuerys = {};

      const field = this.schema.fields[fieldname];
      const rel = {};
      /**
       * Read initial container conditions
       */
      if (field.innerContainer) {
        if (field.innerContainer.schema) {
          Object.entries(field.innerContainer.schema.conditions).map((conditions) => {
            Object.entries(conditions[1]).map((condition) => {
              rel[conditions[0]] = condition[1].valor;
            });
          }, this);
          fieldQuerys[field.name] = rel;
        }

        /**
         * Read Relationships
         */
        if (field.innerContainer.relationship) {
          Object.entries(field.innerContainer.relationship).map((relationship) => {
            const localtarget = relationship[0];
            const source = relationship[1];

            rel[localtarget] = row[source.valor];
          }, this);

          fieldQuerys[field.name] = rel;
        }
      }
      /*
      // updated field querys with (histrix actualiza)
      Object.entries(this.updatedFields).map((fieldArray) => {
        const field = fieldArray[1];

        const relations = field.update_fields;
        relations.map((relation) => {
          // for inner field querys
          const rel = {};
          if (relation.parentField) {
            const query = {};

            query[relation.targetField] = row[field.name];
            rel[relation.field] = query;

            fieldQuerys[relation.parentField] = rel;

            if (fieldQuerys[relation.field] == undefined) {
              rel[relation.field] = query;
              fieldQuerys[relation.parentField] = rel;
            } else {
              fieldQuerys[relation.field][relation.field] = query;
            }
          } else if (fieldQuerys[relation.field] == undefined) {
            rel[relation.targetField] = row[field.name];
            fieldQuerys[relation.field] = rel;
          } else {
            fieldQuerys[relation.field][relation.targetField] = row[field.name];
          }
        }, this);
      }, this);

      // add External Query data
      Object.keys(this.query).map((key) => {
        if (this.query[key]) {
          const query = this.query[key];
          if (typeof query === 'object' || typeof query === 'function') {
            fieldQuerys[key] = query;
          }
        }
      });

      return fieldQuerys;
      */

      return rel;
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
      if (this.schema.type === 'liveGrid') {
        this.updateLiveRow(row);
      }
    },

    getFieldAttribute(rowIndex, name, attr) {
      if (
        this.data[rowIndex].DT_RowAttr?.attributes?.[name] &&
        this.data[rowIndex].DT_RowAttr.attributes[name][attr] !== undefined
      ) {
        return this.data[rowIndex].DT_RowAttr.attributes[name][attr];
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
      const item = JSON.parse(JSON.stringify(this.schema.values));

      // let item = this.defaultItem;
      item._id = this.data.length;
      item._ajax_ = false;
      // this.data.push(item);
      this.editedIndex = item._id;
      this.editedItem = item;
      // Fila nueva del grid: marcar newRecord para que el form muestre el botón
      // Grabar y que saveForm() haga INSERT (POST a la instancia), no UPDATE.
      this.newRecord = true;
      this.edit = true;
    },
    updateLiveRow(row) {
      const postData = {
        keys: this.getKeys(row),
        data: this.getValuesFromRow(row)
      };
      this.updateAppData(this.xmlUrl(), postData)
        .then((_response) => {
          this.$q.notify({
            message: 'Dato Guardado',
            type: 'accept',
            textColor: 'white',
            color: 'info',
            icon: 'info',
            closeBtn: 'cerrar',
            position: 'bottom right'
          });
        })
        .catch((e) => {
          console.error(e);
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
      let idx = -1;
      if (item._id !== undefined) {
        idx = this.data.findIndex((r) => r._id === item._id);
      }
      if (idx < 0 && editedIndex && typeof editedIndex === 'object') {
        idx = this.data.indexOf(editedIndex);
      }
      if (idx >= 0) {
        this.data.splice(idx, 1, item);
      } else {
        this.data.push(item);
      }
      this.edit = false;
      this.setEdit(false);
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
    selectRow(props) {
      const { row } = props;
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

      if (this.hasDetail(props) || this.onlyConsulta) {
        rowclass += ' cursor-pointer ';
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
    deleteItem(item) {
      if (confirm('¿Realmente desea borrar este elemento?')) {
        this.delete(item);
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
      if (this.schema.type === 'grid' || this.schema.type === 'ing') {
        this.insertRow();
      } else {
        this.editedIndex = -1;
        this.newRecord = true;
        this.editedItem = JSON.parse(JSON.stringify(this.schema.values));
      }
      this.insertButton = true;
      this.edit = true;
    },
    editRow(row) {
      // this.editedIndex = this.data.indexOf(row);
      this.editedIndex = row;
      this.newRecord = false;
      this.editedRow = row;
      this.editedItem = Object.assign({}, this.getValuesFromRow(row));
      // this.editedItem = this.data[this.editedIndex]
      /*
      this.$router.push({
        name: "form",
        params: {
          path: this.path,
          editedItem: item2,
          schema: this.schema,
          resources: this.resources
        }
      });
      */

      this.edit = true;
    },
    close() {
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },
    histrixFilter($query) {
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
      const url = this.xmlUrl(this.fullQuery);
      const filters = { ...this.query, ...this.localFilters };

      this.getAppData(url, filters)
        .then((response) => {
          const { data } = response.data;
          data.map((element) => {
            if (element.DT_RowAttr) {
              element._id = element.DT_RowAttr.o;
            }
          });
          // alert('llega')
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
          this.message = 'Error de Carga de Datos';
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
      defaultItem: {},
      dataContainer: null,
      optionsPagination: [
        { label: '5', value: 5 },
        { label: '10', value: 10 },
        { label: '15', value: 15 },
        { label: '20', value: 20 },
        { label: '25', value: 25 },
        { label: '50', value: 50 },
        { label: 'Todos', value: 0 }
      ],
      data: [],
      openFilter: false,
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
