<template>
  <q-card flat class="export-form">
    <!-- Encabezado -->
    <q-card-section class="export-form__header">
      <q-icon name="cloud_download" size="30px" />
      <div class="export-form__heading">
        <div class="export-form__title">Exportar {{ schema.title }}</div>
        <div class="export-form__subtitle">Elegí el formato de descarga</div>
      </div>
    </q-card-section>

    <!-- Opciones de formato -->
    <q-card-section class="export-form__formats">
      <label
        v-for="f in formats"
        v-bind:key="f.format"
        class="export-form__option"
        :class="{ 'export-form__option--active': fileFormat === f.format }"
      >
        <q-radio v-model="fileFormat" :val="f.format" dense />
        <q-icon :name="f.icon" :color="f.color" size="26px" class="export-form__option-icon" />
        <div class="export-form__option-text">
          <div class="export-form__option-name">{{ f.name }}</div>
          <div class="export-form__option-caption">{{ f.caption }}</div>
        </div>
      </label>

      <!-- Delimitador: solo visible cuando el formato lo admite (CSV) -->
      <q-input
        v-if="currentFormat && currentFormat.hasDelimiter"
        v-model="delimiter"
        label="Delimitador"
        hint="Carácter que separa las columnas"
        dense
        filled
        maxlength="3"
        class="export-form__delimiter"
      >
        <template v-slot:prepend>
          <q-icon name="more_vert" />
        </template>
      </q-input>
    </q-card-section>

    <q-separator />

    <!-- Nombre del archivo -->
    <q-card-section>
      <q-input v-model="fileName" label="Nombre del archivo" dense filled>
        <template v-slot:prepend>
          <q-icon name="insert_drive_file" />
        </template>
      </q-input>
    </q-card-section>

    <!-- Acciones -->
    <q-card-actions align="right" class="export-form__actions">
      <q-btn flat label="Cancelar" color="grey-7" no-caps v-close-popup />
      <q-btn
        unelevated
        color="primary"
        icon="cloud_download"
        label="Descargar"
        no-caps
        :loading="downloading"
        @click="downloadFile()"
      />
    </q-card-actions>
  </q-card>
</template>

<script>
import { EXPORT_FORMATS, DEFAULT_DELIMITER, buildExportFileName, buildExportParams, findFormat } from '../core/export.js';
import useApi from '../services/histrixApi.js';

export default {
  name: 'ExportForm',
  props: {
    path: null,
    query: null,
    exportQuery: null,
    schema: {}
  },
  setup() {
    const { downloadAppData } = useApi();
    return { downloadAppData };
  },
  emits: ['close'],
  watch: {
    fileFormat() {
      this.fileName = buildExportFileName(this.schema.title, this.fileFormat);
    }
  },
  mounted() {
    this.fileName = buildExportFileName(this.schema.title, this.fileFormat);
  },
  data() {
    return {
      formats: EXPORT_FORMATS,
      fileName: '',
      fileFormat: 'xls',
      delimiter: DEFAULT_DELIMITER,
      downloading: false
    };
  },
  computed: {
    currentFormat() {
      return findFormat(this.fileFormat);
    },
    params() {
      return buildExportParams({
        query: this.query,
        exportQuery: this.exportQuery,
        format: this.fileFormat,
        delimiter: this.delimiter
      });
    }
  },
  methods: {
    downloadFile() {
      // El service propaga el error; acá (capa UI) lo mostramos.
      this.downloading = true;
      this.downloadAppData(this.path, this.params, this.fileFormat, this.fileName)
        .then(() => {
          this.$emit('close');
        })
        .catch(() => {
          this.$q.notify({
            message: 'Error al descargar el archivo',
            type: 'negative',
            textColor: 'white',
            color: 'negative',
            icon: 'error',
            closeBtn: 'close',
            position: 'top'
          });
        })
        .finally(() => {
          this.downloading = false;
        });
    }
  }
};
</script>

<style scoped>
.export-form {
  width: 440px;
  max-width: 92vw;
}

/* --- Encabezado --- */
.export-form__header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--q-primary, #1976d2);
  color: #fff;
  padding: 18px 20px;
}

.export-form__title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
}

.export-form__subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
}

/* --- Opciones de formato --- */
.export-form__formats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px 8px;
}

.export-form__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e3e7ee;
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.export-form__option:hover {
  border-color: #c9d2e0;
  background: #f8fafc;
}

.export-form__option--active {
  border-color: var(--q-primary, #1976d2);
  background: rgba(25, 118, 210, 0.06);
}

.export-form__option-icon {
  flex: 0 0 auto;
}

.export-form__option-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.export-form__option-name {
  font-weight: 600;
  color: #1d2939;
  line-height: 1.2;
}

.export-form__option-caption {
  font-size: 0.8rem;
  color: #667085;
}

.export-form__delimiter {
  margin-top: 8px;
}

/* --- Acciones --- */
.export-form__actions {
  padding: 12px 16px 16px;
}

.export-form__actions .q-btn {
  border-radius: 8px;
  font-weight: 600;
}
</style>
