<template>
  <div class="q-pa-sm">
    <slot name="slot-top-form" :props="localValues" />
    <q-form @submit="onSubmit" enctype="multipart/form-data">
      <div class="row">
        <div class="col">
          <q-tabs
            v-model="currentTab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab
              v-if="Object.keys(innerTabs).length != 0"
              name="mainTab"
              :label="localSchema.title"
              class="bg-primary text-white"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                Solapa principal {{ localSchema.title }}
              </q-tooltip>
            </q-tab>
            <span v-else>
              {{ localSchema.title }}
            </span>
            <q-tab
              v-for="tab in innerTabs"
              :name="tab.name"
              v-bind:key="tab.name"
              :label="tab.title || tab.name"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                Click para mas información con respecto a {{ tab.title }}
              </q-tooltip>
            </q-tab>
          </q-tabs>

          <q-tab-panels v-model="currentTab" animated>
            <q-tab-panel name="mainTab" class="q-pl-none q-pr-none">
              <div class="row">
                <div
                  v-for="field in editables"
                  v-bind:key="field.name"
                  :name="field.name"
                  :class="fieldClass(field)"
                >
                  <q-item dense>
                    <q-item-section>
                      <q-item-label
                        v-if="
                          editedRow &&
                          editedRow[field.name] &&
                          editedRow[field.name]['link']
                        "
                      >
                        {{ field.title }}
                      </q-item-label>
                      <HistrixCell
                        v-if="
                          editedRow &&
                          editedRow[field.name] &&
                          editedRow[field.name]['link']
                        "
                        :path="path"
                        :props="editedRow[field.name]"
                        :schema="field"
                        :col="{ value: editedRow[field.name] }"
                        v-on:open-popup="bubbleLink(editedRow, $event)"
                        v-on:closepopup="closePopup"
                      />

                      <HistrixField
                        :model-value="localValues[field.name]"
                        @update:model-value="localValues[field.name] = $event"
                        :name="field.name"
                        :row="localValues"
                        :schema="field"
                        :path="computedPath(field)"
                        :submitting="submitting"
                        :query="fieldQuerys[field.name]"
                        :readonly="localSchema.readonly"
                        :disabled="localSchema.readonly"
                        v-on:selectOption="onSelectOption"
                        v-on:fill-fields="fillFields"
                        v-on:computed-total="onComputedTotal"
                        dense
                        v-else-if="!localSchema.readonly"
                      >
                        <template v-slot:slot-top-field-histrixapp="props">
                          <slot
                            name="slot-top-field-histrixapp"
                            :props="props.props"
                          />
                        </template>
                      </HistrixField>
                      <div v-else>
                        <span v-html="localValues[field.name]" />
                      </div>
                    </q-item-section>
                  </q-item>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel
              v-for="field in innerTabs"
              :name="field.name"
              v-bind:key="field.name"
            >
              <HistrixField
                :model-value="localValues[field.name]"
                @update:model-value="localValues[field.name] = $event"
                :name="field.name"
                :schema="field"
                :path="computedPath(field)"
                :row="localValues"
                :submitting="submitting"
                :query="fieldQuerys[field.name]"
                :readonly="localSchema.readonly"
                :disabled="localSchema.readonly"
                v-on:selectOption="onSelectOption"
                v-on:fill-fields="fillFields"
                v-on:computed-total="onComputedTotal"
                dense
                v-if="!localSchema.readonly"
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
      <q-separator />
      <div class="row">
        <span class="q-pa-sm col-12 text-center">
          <q-btn
            label="Cancelar"
            icon="close"
            class="nojustify-end flat"
            @click="closePopup"
            type="reset"
            v-if="insertButton || updateButton"
          />
          <q-btn
            v-if="insertButton || updateButton"
            :disable="v$.$invalid"
            type="submit"
            label="Grabar"
            icon="save"
            class="bg-positive text-white nojustify-end"
            :loading="submitting"
          />
        </span>
      </div>
    </q-form>
    <slot name="slot-botton-form" :props="localValues" />
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core';
import { isFieldEditable as isFieldEditablePure } from '../core/fieldVisibility.js';
import { evaluateFormula } from '../core/formula.js';
import { extractKeys } from '../core/keys.js';
import useApi from '../services/histrixApi.js';
import HistrixCell from './HistrixCell.vue';
import HistrixField from './HistrixField.vue';

export default {
  name: 'HistrixForm',
  props: {
    title: String,
    inner: { type: Boolean, default: false },
    path: String,
    newRecord: { type: Boolean, default: false },
    url: String,
    query: Object,
    schema: Object,
    resources: Object,
    editedItem: null,
    editedRow: null,
    editedIndex: null,
    computedFields: Object
  },
  components: {
    HistrixField,
    HistrixCell
  },
  setup() {
    const { getAppSchema, upload, processAppForm, insertAppData, updateAppData, getAppData } = useApi();
    return { v$: useVuelidate(), getAppSchema, upload, processAppForm, insertAppData, updateAppData, getAppData };
  },
  computed: {
    insertButton() {
      return this.schema.insertButton && (this.editedIndex === -1 || this.editedIndex == null);
    },
    updateButton() {
      return (
        this.canUpdate &&
        !this.localSchema.readonly &&
        !this.localSchema.can_process &&
        !this.insertButton &&
        this.schema.updateButton
      );
    },
    formTitle() {
      return this.title || this.schema.title;
    },
    fieldsWithContainers() {
      return this.filter(this.localSchema.fields, (field) => !field.innerContainer && !field.options);
    },
    editables() {
      return this.filter(this.localSchema.fields, this.isFieldEditable);
    },
    innerTabs() {
      return this.filter(
        this.localSchema.fields,
        (field) =>
          this.schema.type === 'fichaing' || this.schema.type === 'cabecera' || !field.innerContainer || field.isSelect
      );
    },
    dateFields() {
      return this.filter(this.localSchema.fields, (field) => field['data-role'] !== 'datebox');
    },
    /**
     * @description: chequea si el formulario tiene campos de tipo date object
     * @returns {Array || null}
     */
    files() {
      const data = [];
      Object.keys(this.localValues).map((item) => {
        if (this.localSchema.fields[item] && this.localSchema.fields[item].inputType === 'file') {
          data.push({
            name: item,
            data: this.localValues[item],
            path: this.computedPath(this.schema.fields[item])
          });
        }
      });
      return data.length ? data : null;
    },
    postData() {
      const data = this.localValues;
      Object.keys(this.localValues).map((item) => {
        if (this.localValues[item] && typeof this.localValues[item] === 'object' && this.localValues[item].name) {
          data[item] = this.localValues[item].name;
        }
      });
      return data;
    },
    canUpdate() {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      return this.resources.hasOwnProperty('PUT') && this.schema.can_update;
    },
    visibleColumns() {
      if (this.localSchema.columns) {
        return this.localSchema.columns.filter((column) => !column.hidden).map((column, _index, _array) => column.name);
      }
    },
    fieldQuerys() {
      const fieldQuerys = {};

      if (this.fieldsWithContainers) {
        Object.keys(this.fieldsWithContainers).map((target) => {
          const field = this.fieldsWithContainers[target];

          const rel = {};
          /**
           * Read initial container conditions
           */
          if (field.innerContainer.schema) {
            Object.entries(field.innerContainer.schema.conditions).map((conditions) => {
              Object.entries(conditions[1]).map((condition) => {
                const con = condition[1]?.operador ?? null;
                if (con && con === '=') {
                  rel[conditions[0]] = condition[1].valor;
                }
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

              rel[localtarget] = this.localValues[source.valor];
            }, this);

            fieldQuerys[field.name] = rel;
          }
        }, this);
      }

      // updated field querys with (histrix actualiza)
      Object.entries(this.updatedFields).map((fieldArray) => {
        const field = fieldArray[1];

        const relations = field.update_fields;
        relations.map((relation) => {
          // for inner field querys
          const rel = {};
          if (relation.parentField) {
            const query = {};

            query[relation.targetField] = this.localValues[field.name];
            rel[relation.field] = query;

            fieldQuerys[relation.parentField] = rel;

            if (fieldQuerys[relation.field] === undefined) {
              rel[relation.field] = query;
              fieldQuerys[relation.parentField] = rel;
            } else {
              fieldQuerys[relation.field][relation.field] = query;
            }
          } else if (fieldQuerys[relation.field] === undefined) {
            rel[relation.targetField] = this.localValues[field.name];
            fieldQuerys[relation.field] = rel;
          } else {
            const data = this.localValues[field.name];
            if (data) {
              fieldQuerys[relation.field][relation.targetField] = data.value || data;
            }
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
    },
    updatedFields() {
      return this.filter(this.localSchema.fields, (field) => !field.update_fields);
    }
  },
  mounted() {
    this.refresh();
  },
  watch: {
    editedItem: {
      handler(_data) {
        this.localValues = { ...this.editedItem, ...{} };
      },
      deep: true
    },
    localValues: {
      handler(_data, oldVal) {
        if (!this.valueEdit && JSON.stringify(oldVal).length !== 2) {
          this.valueEdit = true;
          this.$emit('valueEdit', true);
        }
        for (const formula in this.computedFields) {
          const result = this.processOperation(this.computedFields[formula]);
          if (result !== undefined) {
            this.localValues[formula] = result;
          }
        }
        this.$emit('update:modelValue', this.localValues);
      },
      deep: true
    },
    v$: {
      handler() {
        this.$emit('validity', !this.v$.$invalid);
      },
      deep: true
    }
  },
  methods: {
    refresh() {
      this.localSchema = this.schema;
      this.localValues = { ...this.editedItem, ...{} };

      Object.keys(this.query).map((key) => {
        this.localValues[key] = this.query[key];
      });
      if (this.query && this.localSchema.preFetch !== false && !this.editedItem) {
        this.getData();
      }
    },
    bubbleLink(row, link) {
      link.row = row;
      this.$emit('open-popup', link);
    },
    closePopup() {
      this.$emit('closepopup');
    },

    computedPath(field) {
      const dirValue = this.localValues[field.path] || '';
      const path = `${this.schema.path}/${dirValue}/`;
      return path.replaceAll('//', '/').replaceAll('//', '/');
    },
    /**
     * recives values from inner tables and updates local field values
     */
    onComputedTotal(data) {
      this.localValues[data.target] = data.value;
    },
    /**
     * Calcula la fórmula de un campo (computed_fields) con los valores actuales.
     * La evaluación vive en core/formula.js (evaluador aritmético seguro, sin eval).
     */
    processOperation(formula) {
      return evaluateFormula(formula, (k) => this.localValues[k]);
    },
    reset() {
      this.localValues = { ...this.editedItem, ...{} };
      this.setDefaultValues();
    },
    fillFields(targets) {
      for (const target in targets) {
        this.localValues[target] = targets[target];
      }
    },
    onSelectOption(data) {
      const selectedOptions = data.selected_option;
      if (selectedOptions) {
        const fieldsToChange = selectedOptions.data;
        for (const fieldName in fieldsToChange) {
          this.localValues[fieldName] = fieldsToChange[fieldName];
        }
      }
    },
    back() {
      this.$router.back();
    },

    fieldClass(field) {
      let span = 0;
      if (field.colspan !== '') {
        span = field.colspan / 2;
      }

      // fields with inner container expands more
      if (field.innerContainer) {
        span = field.colspan;
      }

      let lg = Math.min(4 + span, 12);
      let md = Math.min(6 + span, 12);
      let sm = 12;
      let xs = 12;

      // small forms
      if (this.visibleColumns.length < 6) {
        const all = 12;
        lg = all;
        md = all;
        sm = all;
        xs = all;
      }

      return `col-lg-${lg} col-md-${md} col-sm-${sm} col-xs-${xs}`;
    },

    filter(obj, predicate) {
      return Object.fromEntries(Object.entries(obj).filter(([_key, value]) => !predicate(value)));
    },
    isFieldEditable(field) {
      // TRUE = No mostrar No editable
      // FALSE = Mostrar editable
      // Lógica pura extraída a ../core/fieldVisibility.js; se le pasa el tipo
      // del schema porque la decisión depende de this.schema.type.
      return isFieldEditablePure(field, this.schema.type);
    },
    deleteItem(_item) {
      //
    },
    xmlUrl() {
      return `${this.path}?`;
    },
    getKeys(_item) {
      // Las claves de este form salen de localValues, no del item recibido.
      return extractKeys(this.localValues, this.localSchema.fields);
    },
    processData() {
      this.submitting = true;

      // upload attached files
      if (this.files) {
        this.upload(this.files);
      }
      this.processAppForm(this.xmlUrl(), this.postData)
        .then((response) => {
          this.submitting = false;
          this.$q.notify({
            message: 'PROCESO FINALIZADO',
            type: 'success',
            textColor: 'white',
            color: 'success',
            icon: 'info',
            closeBtn: 'cerrar',
            position: 'top'
          });
          const data = response?.data?.resourceIds || [];
          this.reset();
          this.refresh();
          this.$emit('process-finish', data);
          this.$emit('closepopup');
        })
        .catch((e) => {
          this.$q.notify({
            type: 'negative',
            message: e.response.data,
            position: 'top'
          });
          this.submitting = false;
          this.$events.fire('closepopup');
          this.$emit('process-finish', true);
        });
    },
    onSubmit() {
      if (this.editedIndex === -1 || this.editedIndex === null || this.editedIndex === undefined) {
        this.insertRow();
      } else {
        this.saveForm();
      }
    },
    insertRow() {
      this.saveForm();
    },
    saveForm() {
      // set button state
      this.submitting = true;

      // upload attached files
      if (this.files) {
        this.upload(this.files);
      }

      const postData = {
        keys: this.getKeys(this.editedItem),
        data: this.postData
      };
      // if this is a new record Insert
      if (this.newRecord) {
        this.insertAppData(this.xmlUrl(), postData)
          .then((response) => {
            this.submitting = false;
            this.$emit('closepopup');
            this.$emit('form-saved', this.localValues, response.data.id);
            this.$emit('insert-row', this.localValues, response.data.id);
          })
          .catch((e) => {
            console.error(e);
            this.submitting = false;
            this.$events.fire('histrix-error-http', e);
          });
      } else {
        this.updateAppData(this.xmlUrl(), postData)
          .then((_response) => {
            this.submitting = false;
            this.$emit('closepopup');
            this.$emit('form-saved', this.localValues, this.editedIndex);
          })
          .catch((e) => {
            console.error(e);
            this.submitting = false;
          });
      }
    },
    setDefaultValues() {
      for (const key in this.localSchema.fields) {
        const field = this.localSchema.fields[key];
        if (
          // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
          field.hasOwnProperty('default_option_value') &&
          this.localValues[field.name] === '' &&
          field.default_option_value !== ''
        ) {
          this.localValues[field.name] = field.default_option_value;
        }
      }
    },
    getData() {
      this.getAppData(this.xmlUrl(), this.query)
        .then((response) => {
          this.localValues = response.data.data[0];
          this.setDefaultValues();
        })
        .catch((_e) => {
          this.dialog = true;
          this.message = 'Error de Carga de Datos';
        });
    }
  },
  validations() {
    return {};
  },
  emits: [
    'valueEdit',
    'update:modelValue',
    'validity',
    'open-popup',
    'closepopup',
    'process-finish',
    'form-saved',
    'insert-row'
  ],
  data() {
    return {
      localValues: {},
      errorMessages: {},
      localSchema: {
        fields: {},
        columns: []
      },
      data: [],
      submitting: false,
      currentTab: 'mainTab',
      valueEdit: false
    };
  }
};
</script>
