<template>
  <div v-show="isVisible" @histrix-help="onHelpKey">
    <div v-if="isRadio">
      <div class="header-check">
        <b>{{ rowSchema.label }}</b>
      </div>
    </div>
    <div v-if="fieldComponent?.name === 'HistrixApp'">
      <slot name="slot-top-field-histrixapp" :props="localValue" />
    </div>
    <div class="content-field">
      <component
        v-bind:is="fieldComponent"
        :model-value="localValue"
        @update:model-value="onFieldInput"
        v-bind="$attrs"
        style="flex: 1;"
        v-on:computed-total="onComputedTotal"
        @filter="filterFn"
        bottom-slots
        :name="fieldSchema.name"
        use-input
        :type="inputType"
        :path="helperPath"
        :headers="headers"
        :url="uploadUrl"
        :query="query"
        :options="options"
        emit-value
        map-options
        debounce="500"
        hide-bottom-space
        :label="label"
        :inner="true"
        :mask="fieldMask"
        :isFormulation="true"
        :filled="!isDisabled"
        :toolbar="toolbar"
        :disabled="isDisabled || undefined"
        :disable="isDisabled || undefined"
        :readonly="isDisabled || undefined"
        :counter="isMultiple"
        :fonts="{
          arial: 'Arial',
          arial_black: 'Arial Black',
          comic_sans: 'Comic Sans MS',
          courier_new: 'Courier New',
          impact: 'Impact',
          lucida_grande: 'Lucida Grande',
          times_new_roman: 'Times New Roman',
          verdana: 'Verdana',
        }"
        :size="size"
        :use-chips="isMultiple"
        :multiple="isMultiple"
        :autogrow="isTextarea"
        :style="style"
        :input-class="inputClass"
        :clearable="clearable"
        :error="v$.modelValue?.$error"
        :error-message="v$.modelValue?.$errors?.[0]?.$message"
        inline
        :borderless="isDisabled"
        :autocomplete="autoComplet"
      >
        <span
          v-if="histrixType === 'check'"
          v-html="hint"
          class="text-blue text-bold text-caption q-ml-md"
        ></span>
        <template v-slot:hint>
          <div v-html="hint" :title="hint" class="text-blue text-bold"></div>
        </template>

        <template v-slot:before v-if="histrixType === 'q-file'">
          <q-avatar size="100px">
            <q-img
              :src="previewUrl"
              v-if="previewUrl"
              @click="showImage = true"
            />
            <q-img
              _v-else-if="value"
              :src="thumb"
              spinner-color="grey"
              @click="showImage = true"
            />
          </q-avatar>
          <q-dialog v-model="showImage">
            <q-card style="width: 700px; max-width: 80vw">
              <q-card-section class="row items-center q-pb-none">
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>
              <q-card-section>
                <q-img :src="previewUrl" v-if="previewUrl" spinner-color="grey" />
                <q-img :src="thumb" v-else spinner-color="grey"> </q-img>
              </q-card-section>
            </q-card>
          </q-dialog>
        </template>

        <template v-slot:prepend>
          <q-icon v-if="histrixType === 'q-file'" name="attach_file" />
          <span class="q-pa-xs text-caption" v-if="isRadio">
            {{ label }}
          </span>
          <q-icon
            name="search"
            class="cursor-pointer"
            v-if="fieldSchema.helpContainer"
            @click="showHelp = true"
          />
          <q-menu
          v-if="fieldSchema.helpContainer"
          v-model="showHelp"
          no-parent-event
          no-focus
          no-refocus
          anchor="bottom left"
          self="top left"
          transition-show="scale"
          transition-hide="scale"
        >
          <HistrixHelp
            :help-container="fieldSchema.helpContainer"
            :form-values="row"
            :label="label"
            :term="localValue"
            v-on:select-row="selectRow"
          />
        </q-menu>
        </template>

        <!-- in control button -->
        <template v-slot:append>
          <!-- EXTERNAL HELP POPUP -->


          <!-- DATE CONTROL POPUP -->
          <q-icon name="event" class="cursor-pointer" v-if="isDate">
            <q-popup-proxy
              ref="qDateProxy"
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                mask="DD/MM/YYYY"
                :locale="dateLocale"
                v-model="localValue"
                @update:model-value="() => $refs.qDateProxy.hide()"
                @input="() => $refs.qDateProxy.hide()"
              />
            </q-popup-proxy>
          </q-icon>

          <!-- IMAGE FOLDER -->
          <q-icon
            v-if="histrixType === 'q-file'"
            name="close"
            @click.stop="localValue = null"
            class="cursor-pointer"
          />

          <!-- TIME CONTROL POPUP -->
          <q-icon name="access_time" class="cursor-pointer" v-if="isTime">
            <q-popup-proxy
              ref="timeProxy"
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time
                v-model="localValue"
                @input="() => $refs.timeProxy.hide()"
              />
            </q-popup-proxy>
          </q-icon>
          <q-icon name="event" class="cursor-pointer" v-if="isDateTime">
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-date v-model="localValue" mask="YYYY-MM-DD HH:mm:ss">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Cerrar" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>

          <q-icon name="access_time" class="cursor-pointer" v-if="isDateTime">
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-time v-model="localValue" mask="YYYY-MM-DD HH:mm:ss" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Cerrar" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No resultado </q-item-section>
          </q-item>
        </template>
      </component>
      <div v-if="isViewAddButton">
        <q-btn
          round
          class="q-ml-xs"
          dense
          color="green"
          icon="add"
          @click="openAdd"
        />
      </div>
    </div>

    <q-dialog v-model="openNew" ref="formDialog" full-width @update:model-value="showDialog" @input="showDialog">
        <HistrixApp
          :inner="false"
          :path="dialog.path"
          :query="dialog.query"
          :title="dialog.title"
          @process-finish="fetchData"
          class="bg-white"
          :editedIndex="-1"
        />
    </q-dialog>
  </div>
</template>

<script>
import { QCheckbox, QEditor, QFile, QInput, QOptionGroup, QSelect, QToggle } from 'quasar';

import { useVuelidate } from '@vuelidate/core';
import { email, helpers, maxLength, required } from '@vuelidate/validators';
import { computeFormulaFlags, parseDataFormulas } from '../core/dataFormulas.js';
import { backendDateToDisplay, dateSortParts, displayDateToBackend } from '../core/dates.js';
import { resolveFieldKind } from '../core/fieldType.js';
import { mapArrayOptions, mapDictOptions, mapRemoteOptions } from '../core/options.js';
import { defineLazyComponent } from '../services/asyncComponents.js';
import useApi from '../services/histrixApi.js';
import HistrixHelp from './HistrixHelp.vue';

// Número con decimales: separador decimal punto o coma, miles opcionales con
// el otro separador, signo, espacios alrededor y notación exponencial.
const DECIMAL_RE = /^\s*[-+]?(?=[.,]?\d)(\d+|\d{1,3}([.,]\d{3})+)?([.,]\d*)?([eE][-+]?\d+)?\s*$/;

export default {
  name: 'HistrixField',
  inheritAttrs: false,
  props: {
    schema: Object,
    rowSchema: Object,
    query: Object,
    modelValue: null,
    row: null,
    submitting: null,
    path: null
  },
  setup() {
    const { getAppSchema, getAppData, apiUrl } = useApi();
    return { v$: useVuelidate(), getAppSchema, getAppData, apiUrl };
  },
  watch: {
    localValue: {
      handler(newVal, _oldVal) {
        if (this.fieldSchema.histrix_type === 'File') {
          this.onFileChange(newVal);
        }
      },
      immediate: true,
      deep: true
    },
    schema: {
      handler(_newVal, _oldVal) {
        this.getOptions(true);
      },
      deep: true
    },
    query: {
      handler(newVal, oldVal) {
        if (!this.shallowEqual(newVal, oldVal)) {
          this.getOptions(true);
        }
      },
      deep: true
    },
    options: {
      handler(_newVal, _oldVal) {
        if (this.options.find((o) => o.value === this.localValue)) {
          return;
        }
        if (this.options.length === 1 && this.fieldSchema.innerContainer?.empty === false) {
          this.localValue = this.options[0].value;
          return;
        }
        // @TODO: Verificar porque para rosgan tiene que estar comentado pero para mgp no
        // this.localValue = '';
      },
      deep: true
    }
  },
  components: {
    HistrixApp: defineLazyComponent(() => import('./HistrixApp.vue')),
    HistrixFileManager: defineLazyComponent(() => import('./widgets/HistrixFileManager.vue')),
    HistrixHelp
  },
  emits: ['selectOption', 'computed-total', 'fill-fields', 'update:modelValue', 'field-change'],
  methods: {
    showDialog() {
      this.openNew = false;
    },
    fetchData(data) {
      this.getOptions(true);
      const value = data?.[0]?.id;
      if (value) {
        this.localValue = value;
        this.$emit('selectOption', { value: value, selected_option: value });
      }
      this.openNew = false;
    },
    openAdd() {
      const dialog = {};
      const link = this.fieldSchema.helpers?.link;
      const path = `${link.dir}/${link.xml}`;
      dialog.path = path;
      dialog.query = { ...this.query };
      dialog.title = `Agregar ${this.label}`;
      this.dialog = dialog;
      this.openNew = true;
    },
    shallowEqual(object1, object2) {
      const keys1 = Object.keys(object1);
      const keys2 = Object.keys(object2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      for (const key of keys1) {
        if (object1[key] !== object2[key]) {
          return false;
        }
      }

      return true;
    },

    /**
     * Filtra las opciones de la peticion, en caso que sea autocomplete, filtrara el input a partir del tercer caracter
     * @returns Prmosise<void>|String
     */
    async filterFn(val, update, _about) {
      if (this.autoComplet === 'true') {
        if (val.length < 3) {
          this.options = [];
          update();
          return;
        }
        await this.searchOptions(val);
        update();
        return;
      }

      update(() => {
        if (!val) {
          this.options = this.optionFixed;
          return;
        }
        const accent_map = {
          á: 'a',
          é: 'e',
          í: 'i',
          ó: 'o',
          ú: 'u',
          Á: 'a',
          É: 'e',
          è: 'e',
          Í: 'i',
          Ó: 'o',
          Ú: 'u'
        };
        const accent_fold = (data) => {
          let ret = '';
          for (let i = 0; i < data.length; i++) {
            ret += accent_map[data.charAt(i)] || data.charAt(i);
          }
          return ret;
        };
        const needle = accent_fold(val.toLowerCase());
        this.options = this.optionFixed.filter((v) => {
          const notAccent = accent_fold(v.label.toLowerCase());
          return notAccent.indexOf(needle) > -1;
        });
      });
    },
    uploadFn(_file) {
      return new Promise((resolve, _reject) => {
        // Retrieve JWT token from your store.
        // const token = "myToken";
        resolve({
          url: this.uploadUrl,
          method: 'POST',
          headers: this.headers
        });
      });
    },
    showHelper() {
      if (this.fieldSchema.helpContainer) {
        this.showHelp = true;
      }
    },
    /**
     * F2 con el foco en el campo (atajo de HistrixApp, ver core/hotkeys.js):
     * abre la ayuda. Cancela el evento para avisar que lo atendió; Esc la
     * cierra QDialog.
     */
    onHelpKey(event) {
      if (!this.fieldSchema.helpContainer) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.showHelper();
    },
    /**
     * Input del usuario en el campo. Setea el valor y, si el campo tiene ayuda,
     * abre el popup con la lista filtrada por lo tipeado (typeahead). NO auto-
     * selecciona nada: el usuario elige de la lista. Sólo se dispara al tipear
     * (no en cambios programáticos como el fill al elegir una fila).
     */
    onFieldInput(value) {
      this.localValue = value;
      if (!this.fieldSchema.helpContainer) {
        return;
      }
      clearTimeout(this.delayTimer);
      if (value === '' || value === null || value === undefined) {
        this.showHelp = false;
        return;
      }
      this.delayTimer = setTimeout(() => {
        this.showHelp = true;
      }, 350);
    },
    onImageChange(_image) {
      // Hook intencionalmente vacío; se sobreescribe en componentes que lo usan.
    },
    onFileChange: function (file) {
      this.previewUrl = 'entra';
      //const file = files[0]
      if (!file) {
        return false;
      }
      if (!file.type.match('image.*')) {
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    onComputedTotal(data) {
      this.$emit('computed-total', data);
    },
    selectRow(args) {
      const { row } = args;
      if (!row) {
        this.showHelp = false;
        return;
      }
      const fill = { ...row };
      // El campo de búsqueda toma el valor de su `help_key` en la fila elegida.
      // El mapa del backend (data-helpdetail) rellena los campos "detalle" pero
      // no siempre el propio campo de búsqueda: p. ej. `codigo_detalle`
      // (help_key: id_stkarticulo) queda vacío porque la ayuda mapea a
      // `id_stkarticulo`, no a `codigo_detalle`. Acá lo reflejamos.
      const helpKey = this.fieldSchema.help_key;
      if (helpKey && fill[helpKey] != null && !fill[this.fieldSchema.name]) {
        fill[this.fieldSchema.name] = fill[helpKey];
      }
      this.$emit('fill-fields', fill);
      this.showHelp = false;
    },
    // Wrapper fino: la normalización pura vive en ../core/options.js.
    // Acá sólo se mantiene la parte que depende de `this` (orderData, que usa
    // this.formatDate, y la asignación reactiva de this.optionFixed).
    mapRemoteOptions(options) {
      const { data, flat } = mapRemoteOptions(options, this.helperPath);
      // El original hacía un early return con `!options` SIN tocar optionFixed.
      if (!options) return data;
      if (this.fieldSchema.sortable !== false) {
        this.orderData(data, flat);
      }
      this.optionFixed = data;
      return data;
    },
    mapOptions(options) {
      const { data, flat } = mapArrayOptions(options, this.helperPath);
      // El original sólo ordena/llama orderData cuando `options` existe.
      if (options && this.fieldSchema.sortable !== false) {
        this.orderData(data, flat);
      }
      this.optionFixed = data;
      return data;
    },
    mapOptionsOld(options) {
      const { data, flat } = mapDictOptions(options, this.helperPath);
      // El original llama orderData sólo cuando `options` existe.
      if (options) {
        this.orderData(data, flat);
      }
      this.optionFixed = data;
      return data;
    },

    orderData(data, flat) {
      if (!flat) {
        if (typeof data[0]?.data === 'object') {
          const keys = Object.keys(data[0].data);
          const order = keys.filter((key) => key.includes('orden'));
          if (order) {
            return data.sort((a, b) => (Number.parseInt(a.data[order]) > Number.parseInt(b.data[order]) ? 1 : -1));
          }
        }
        return data.sort((a, b) => (a.label > b.label ? 1 : -1));
      }
      data.sort((prev, next) => {
        const dateNextFormat = this.formatDate(next.label.slice(0, 10));
        const tempNext = new Date(dateNextFormat[0], dateNextFormat[1], dateNextFormat[2]);
        const datePrevFormat = this.formatDate(prev.label.slice(0, 10));
        const tempPrev = new Date(datePrevFormat[0], datePrevFormat[1], datePrevFormat[2]);
        if (tempPrev.getTime() > tempNext) return -1;
        if (tempPrev.getTime() < tempNext) return 1;
        return 0;
      });
    },

    formatDate(props) {
      // Descomposición para ordenar combos por fecha — extraída a ../core/dates.js.
      return dateSortParts(props);
    },
    /**
     * Realiza la peticion de busqueda cuando autocomplete es 'true'
     * @param {*} valueSearch
     * @return Promise<Array>
     */
    async searchOptions(valueSearch) {
      try {
        let field = await this.getAppSchema(this.innerContainerUrl);
        field = Object.keys(field.data.schema.fields)[1];
        const response = await this.getAppData(this.innerContainerUrl, {
          '_f[]': `${field}`,
          '_o[]': 'like',
          '_v[]': valueSearch
        });
        // this.options = this.mapOptions(response.data.data);
        this.options = this.mapRemoteOptions(response.data.data);
        const option = this.options.find((obj) => obj.value === valueSearch);
        this.$emit('selectOption', {
          selected_option: option
        });
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * Sirve para traer las opciones del campo
     * @returns void
     */
    getOptions(_refresh = false) {
      let refresh = _refresh;
      const opt = this.fieldSchema?.options_sorted ?? this.fieldSchema?.options;
      if (!refresh && this.rowSchema && opt) {
        this.options = this.mapOptionsOld(opt);
        refresh = false;
      } else {
        refresh = true;
      }

      const val = this.localValue ? this.localValue.value || this.localValue : null;

      if (this.hasOptions) {
        if (this.query !== undefined && Object.entries(this.query).length !== 0) {
          if (this.autoComplet === 'true') return;
          if (refresh || this.histrixType === 'radio') {
            this.getAppData(this.innerContainerUrl, this.query)
              .then((response) => {
                // this.options = this.mapOptions(response.data.data);
                this.options = this.mapRemoteOptions(response.data.data);

                const option = this.options.find((obj) => obj.value === val);
                this.$emit('selectOption', {
                  value: val,
                  selected_option: option
                });
              })
              .catch((e) => {
                console.error(e);
              });
          }
        } else {
          if (this.fieldSchema.full_options) {
            this.options = this.mapOptions(this.fieldSchema.full_options);
          } else {
            this.options = this.mapOptionsOld(opt);
          }

          const option = this.options.find((obj) => obj.value === val);
          if (option) {
            this.$emit('selectOption', { value: val, selected_option: option });
          }
        }
      }
    }
  },

  data() {
    return {
      delayTimer: 0,
      showHelp: false, // popup de ayuda (typeahead) abierto
      previewUrl: '--',
      fileManager: false,
      showImage: false,
      helpFoundes: true,
      options: [],
      optionFixed: [],
      dialog: {},
      toolbar: [],
      openNew: false,
      type: 'q-input',
      dateLocale: {
        /* starting with Sunday */
        days: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
        daysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
        months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
        monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
        firstDayOfWeek: 1
      }
    };
  },
  created() {
    // this.getOptions(true);
  },
  mounted() {
    this.getOptions(true);
    // Validación diferida: NO marcamos el campo como "tocado" al montar. Antes
    // se hacía v$.modelValue.$touch() acá, lo que pintaba los requeridos en rojo
    // apenas se abría el formulario sin que el usuario tocara nada. Ahora el
    // error sólo aparece cuando el usuario interactúa con el campo o cuando se
    // intenta grabar (HistrixForm.validateAndFocus dispara v$.$validate()).
  },
  computed: {
    /**
     * Se utiliza para indicar si el campo es autocompletable o no para la busqueda.
     * @options 'on'|'off'|'true'|'false'
     * @return String
     */
    autoComplet() {
      return this.fieldSchema.autocomplete;
    },
    rules() {
      const validations = {};
      const isRequired =
        this.fieldSchema?.required === 'required' ||
        this.fieldSchema?.required === 'true' ||
        this.dataFormulaFlags.required === true; // data-formulas: __REQUIRED dinámico
      if (isRequired) {
        validations.modelValue = {
          ...validations.modelValue,
          required: helpers.withMessage('* Valor requerido', required)
        };
      }
      if (this.isDecimal) {
        validations.modelValue = {
          ...validations.modelValue,
          decimal: helpers.withMessage('* Valor decimal', helpers.regex(DECIMAL_RE))
        };
      }
      if (this.histrixType === 'email') {
        validations.modelValue = { ...validations.modelValue, email: helpers.withMessage('Valor email', email) };
      }
      if (this.fieldSchema?.max_length && this.fieldSchema?.max_length !== '0') {
        validations.modelValue = {
          ...validations.modelValue,
          maxLength: helpers.withMessage(
            `No puede tener mas de ${this.fieldSchema.max_length} caracteres`,
            maxLength(this.fieldSchema.max_length)
          )
        };
      }
      if (this.fieldSchema?.mask) {
        const regex = new RegExp(
          this.fieldSchema.mask.replace(/9/g, '\\d').replace(/a/g, '[a-zA-Z]').replace(/\*/g, '[a-zA-Z0-9]')
        );
        validations.modelValue = {
          ...validations.modelValue,
          mask: helpers.withMessage('Valor incorrecto', helpers.regex(regex))
        };
      }
      return validations;
    },
    hint() {
      return this.fieldSchema.placeholder !== this.fieldSchema.title ? this.fieldSchema.placeholder : '';
    },
    fieldSchema() {
      return { ...this.schema, ...this.rowSchema };
    },
    /**
     * Directivas dinámicas del campo (data-formulas): { required?, visible?, enabled? }.
     * Se evalúan contra los valores actuales del form (this.row), así que reaccionan
     * cuando cambian los campos referenciados en las fórmulas.
     */
    dataFormulaFlags() {
      const formulas = parseDataFormulas(this.fieldSchema['data-formulas']);
      if (!formulas.length) {
        return {};
      }
      return computeFormulaFlags(formulas, (name) => {
        const value = this.row?.[name];
        if (value !== null && typeof value === 'object') {
          return value.value !== undefined ? value.value : value._;
        }
        return value;
      });
    },
    /** __VISIBLE: el campo se oculta si una fórmula de visibilidad da false. */
    isVisible() {
      return this.dataFormulaFlags.visible !== false;
    },
    clearable() {
      return this.fieldComponent?.name === 'QSelect' && this.fieldSchema.innerContainer.empty === true;
    },
    inputClass() {
      return `text-${this.fieldSchema.align}`;
    },
    fieldMask() {
      if (this.fieldSchema.mask) {
        return this.fieldSchema.mask.replace(/9/g, '#');
      }
      let mask = '';
      if (this.isDate) {
        mask = '##/##/####';
      }

      if (this.isTime) {
        mask = 'time';
      }
      if (this.isDateTime) {
        mask = '####-##-## ##:##:##';
      }
      return mask;
    },
    /**
     *
     * @returns String
     */
    innerContainerUrl() {
      const { innerContainer } = this.schema;
      let url = `${innerContainer.dir}/${innerContainer.xml}`;
      if (this.fieldSchema.helperXml) {
        url = this.fieldSchema.helperXml;
      }
      return url;
    },
    isDisabled() {
      if (this.submitting) {
        return true;
      }
      // data-formulas: __ENABLED dinámico. Si una fórmula lo deshabilita, gana.
      if (this.dataFormulaFlags.enabled === false) {
        return true;
      }
      if (this.histrixType === 'object') {
        return false;
      }
      if (this.row && this.fieldSchema.enabler) {
        return (
          this.row[this.fieldSchema.enabler] === '0' ||
          this.row[this.fieldSchema.enabler] === 0 ||
          this.row[this.fieldSchema.enabler] === 'false'
        );
      }
      if (this.fieldSchema.deshabilitado === 'true') {
        return true;
      }
      if (this.fieldSchema.deshabilitado === 'false') {
        return false;
      }
      return this.fieldSchema.disabled === 'disabled';
    },
    hasOptions() {
      const opt = this.fieldSchema?.options_sorted ?? this.fieldSchema?.options;
      return (opt && Object.keys(opt).length !== 0) || this.fieldSchema.isSelect;
    },
    renderHelper() {
      return this.fieldSchema.innerContainer && !this.hasOptions;
    },
    headers() {
      return [{ name: 'Authorization', value: `Bearer ${localStorage.accessToken}` }];
    },
    uploadUrl() {
      return `${this.apiUrl()}/files/${this.path}`;
    },
    thumb() {
      return `${this.apiUrl()}/thumb/${this.path}${this.modelValue}`;
    },
    helperPath() {
      const helper = this.fieldSchema.innerContainer;
      const url = `${helper.dir}/${helper.xml}`;
      return url.replace('//', '/');
    },
    isViewAddButton() {
      return !!this.fieldSchema?.helpers?.link;
    },
    size() {
      return this.fieldSchema.size.toString();
    },
    isMultiple() {
      return this.fieldSchema
        ? this.fieldSchema.multiple === 1 || this.fieldSchema.multiple === 'multiple'
        : this.schema.multiple === 'multiple';
    },
    isTextarea() {
      return this.fieldSchema.size > 90;
    },
    isDate() {
      return this.schema['data-role'] === 'datebox' || this.histrixType === 'date';
    },
    isTime() {
      return this.histrixType === 'time';
    },
    isDecimal() {
      // Sólo decide la validación. La máscara numérica (decimales, separadores)
      // queda para el renderer numérico.
      return this.histrixType === 'decimal';
    },
    isDateTime() {
      return this.histrixType === 'datetime';
    },
    label() {
      // if (!this.isDisabled) {
      if (this.fieldSchema.label || this.fieldSchema.title) {
        return this.fieldSchema.label || this.fieldSchema.title;
      }

      // }
    },
    fieldComponent() {
      let component = 'q-input';
      switch (this.histrixType) {
        case 'radio':
          component = QOptionGroup;
          break;
        case 'q-file':
          component = QFile;
          break;
        case 'check':
          component = QCheckbox;
          break;
        case 'toggle':
          component = QToggle;
          break;
        case 'q-editor':
          component = QEditor;
          this.toolbar = [
            [
              {
                label: this.$q.lang.editor.align,
                icon: this.$q.iconSet.editor.align,
                fixedLabel: true,
                list: 'only-icons',
                options: ['left', 'center', 'right', 'justify']
              }
            ],
            ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
            ['token', 'hr', 'link', 'custom_btn'],
            ['print', 'fullscreen'],
            [
              {
                label: this.$q.lang.editor.formatting,
                icon: this.$q.iconSet.editor.formatting,
                list: 'no-icons',
                options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code']
              },
              {
                label: this.$q.lang.editor.fontSize,
                icon: this.$q.iconSet.editor.fontSize,
                fixedLabel: true,
                fixedIcon: true,
                list: 'no-icons',
                options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7']
              },
              {
                label: this.$q.lang.editor.defaultFont,
                icon: this.$q.iconSet.editor.font,
                fixedIcon: true,
                list: 'no-icons',
                options: [
                  'default_font',
                  'arial',
                  'arial_black',
                  'comic_sans',
                  'courier_new',
                  'impact',
                  'lucida_grande',
                  'times_new_roman',
                  'verdana'
                ]
              },
              'removeFormat'
            ],
            ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

            ['undo', 'redo'],
            ['viewsource']
          ];
          break;
        case 'q-input':
          component = QInput;
          break;
        case 'q-select':
          component = QSelect;
          break;
        case 'object':
          component = defineLazyComponent(() => import('./HistrixApp.vue'));
          break;
        default:
          component = QInput;
          break;
      }
      return component;
    },

    isRadio() {
      return this.histrixType === 'radio';
    },
    inputType() {
      if (this.fieldSchema.histrix_type === 'File') {
        return this.fieldSchema.histrix_type;
      }
      if (this.histrixType === 'radio') {
        return this.histrixType;
      }
      if (this.isDateTime) {
        return 'text';
      }
      if (this.fieldComponent?.name === 'QSelect' && this.hasOptions === true) {
        return 'text';
      }
      if (this.fieldSchema.type === 'number') {
        return 'number';
      }
      return this.fieldSchema.type;
    },
    histrixType() {
      // Decisión pura del tipo de campo extraída a ../core/fieldType.js.
      // `this.type` (data) es el valor base, igual que el `let { type } = this`
      // original. El render (map kind -> QComponent) sigue en `fieldComponent`.
      return resolveFieldKind(this.fieldSchema, this.type);
    },
    style() {
      const style = this.fieldSchema.style || '';
      return `width: 100%; ${style}`;
    },
    dateMask() {
      return 'DD/MM/YYYY';
    },

    localValue: {
      get() {
        if (this.histrixType === 'check' || this.histrixType === 'toggle') {
          if (typeof this.modelValue === 'boolean') {
            return this.modelValue;
          }
          if (this.modelValue === '') return false;
          if (typeof this.modelValue === 'string') return this.modelValue !== '0';
          return this.modelValue !== 0;
        }
        if (this.histrixType === 'radio') {
          if (this.modelValue === '' || this.modelValue === null || this.modelValue === undefined) {
            return undefined;
          }
          if (typeof this.modelValue === 'string' || this.modelValue instanceof String) {
            return !Number.isNaN(this.modelValue) && this.modelValue !== '' ? Number(this.modelValue) : this.modelValue;
          }
          return this.modelValue;
        }
        if (this.isDate) {
          // Conversión backend → display extraída a ../core/dates.js (sin Quasar).
          return backendDateToDisplay(this.modelValue, this.dateMask);
        }

        if (this.histrixType === 'q-select' && this.options) {
          if (!this.isMultiple) {
            // El backend a veces manda un objeto como valor inicial (p.ej.
            // { genmoneda_id: '1' }, sólo contexto, sin cuenta elegida). En ese
            // caso no hay opción seleccionable: tomar .value si viene, si no,
            // dejar el combo sin selección (evita pintar "[object Object]").
            if (this.modelValue !== null && typeof this.modelValue === 'object') {
              return this.modelValue.value ?? undefined;
            }
            return !Number.isNaN(Number(this.modelValue)) && this.modelValue !== ''
              ? Number(this.modelValue)
              : this.modelValue;
            // return this.options.find(obj => obj.value == this.modelValue);
          }
          if (this.modelValue === '' || this.modelValue === null || this.modelValue === undefined) {
            return undefined;
          }

          if (typeof this.modelValue === 'string' || this.modelValue instanceof String) {
            let items = JSON.parse(this.modelValue);
            if (!Array.isArray(items)) {
              items = [this.modelValue];
            }
            items = items.map((item) => {
              // Si es un número válido, convertirlo a Number. Si no, dejarlo igual.
              return !Number.isNaN(Number(item)) && item !== '' ? Number(item) : item;
            });
            return items;
          }
        }

        // if (this.histrixType == 'q-file') {
        //   return null
        //  return this.modelValue.name
        // }

        // if (this.histrixType == 'object') {
        //   return this.modelValue;
        // }

        if (this.modelValue) {
          return this.modelValue.value !== undefined ? this.modelValue.value : this.modelValue;
        }

        return this.modelValue;
      },
      set(localValue) {
        // Vue 3: el v-model del padre escucha `update:modelValue` (antes se
        // emitía `input`, de Vue 2, y el cambio nunca subía al padre).
        if (this.histrixType === 'q-select') {
          const val = localValue;
          if (localValue !== null && typeof localValue === 'object' && 'value' in localValue) {
            this.$emit('update:modelValue', localValue.value);
          } else {
            this.$emit('update:modelValue', localValue);
          }

          const option = this.options.find((obj) => obj.value === val);
          this.$emit('selectOption', {
            value: localValue,
            selected_option: option
          });
        } else {
          if (this.isDate) {
            // Conversión display → ISO backend extraída a ../core/dates.js.
            const r = displayDateToBackend(localValue, this.dateMask);
            this.$emit('update:modelValue', r.value);
            if (r.passthrough) {
              this.$emit('field-change', this.row);
              return;
            }
          } else {
            this.$emit('update:modelValue', localValue);
          }
        }

        this.$emit('field-change', this.row);
      }
    }
  },
  events: {
    'reset-field'(names) {
      const namesArray = typeof names === 'string' ? [names] : names;
      if (namesArray.includes(this.fieldSchema.name)) {
        this.localValue = '';
      }
    }
  },
  validations() {
    return this.rules;
  }
};
</script>
<style scoped>
.content-field {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}
</style>
