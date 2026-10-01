<template>
  <div style="width: 100%">
    <q-img v-if="hasMap" :src="LinkMap" spinner-color="white" />
    <!-- @TODO: Sacar esto a un componente aparte -->
    <div v-else-if="hasThumb">
      <q-img :src="thumb" spinner-color="white" @click="showImage = true" />
      <q-dialog v-model="showImage">
        <q-card style="width: 700px; max-width: 80vw">
          <q-card-section class="row items-center q-pb-none">
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section>
            <q-img :src="thumb" spinner-color="white"> </q-img>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
    <q-btn
      v-else-if="
        (col.value && col.value.link && col.value.text) ||
        (col.link && col.value)
      "
      :_to="link"
      class="fit"
      dense
      size="sm"
      :style="col.value.button_style"
      :icon="icon"
      @click="
        $emit('open-popup', {
          link: col.value && col.value.link ? col.value.link : null,
          title: col.value.text,
          parameters: col.value['linkParameters'],
        })
      "
    >
      {{ text }}
    </q-btn>
    <q-icon v-else-if="isCheck" :name="checkIcon"> </q-icon>
    <q-linear-progress
      v-else-if="isProgress"
      :value="col.value.value / 100"
      color="accent"
      size="20px"
    >
      <div class="absolute-full flex flex-center">
        <q-badge
          color="transparent"
          text-color="black"
          :label="col.value.value"
        />
      </div>
    </q-linear-progress>
    <div v-else v-html="formatedValue" :class="schema.class"></div>
    <!-- TODO IMPLEMENT PROGRESS METER -->
  </div>
</template>

<script>
import { mapUiIcon } from '../core/icons.js';
import { formatNumber, isNumericField, numericSpec } from '../core/numeric.js';
import useApi from '../services/histrixApi.js';

export default {
  name: 'HistrixCell',
  setup() {
    const { apiUrl, host, currentDb } = useApi();
    return { apiUrl, host, currentDb };
  },
  props: {
    schema: Object,
    value: Object,
    col: Object,
    path: String
  },
  emits: ['open-popup'],
  computed: {
    thumb() {
      if (this.col.value.thumb) {
        return `${this.apiUrl()}/thumb/${this.col.value.computedPath}`;
      }
      return null;
    },
    isProgress() {
      return this.schema.histrix_type === 'Grafico';
    },
    hasThumb() {
      return !!this.col?.value?.thumb;
    },
    hasMap() {
      if (!this.schema) return false;
      return this.schema.histrix_type === 'Map';
    },
    keyGoogleMapsStatic() {
      if (!this.hasMap) return '';
      if (!this.$attrs?.props?.row?.staticKey?._) return '';
      return this.$attrs.props.row.staticKey._;
    },
    LinkMap() {
      if (!this.hasMap) return false;
      return `https://maps.googleapis.com/maps/api/staticmap?&zoom=7&size=300x300&markers=${this.innerValue}&format=png&style=feature:road|visibility:off&style=feature:administrative.province|element:geometry|weight:3.38|color:0x1e00e6&key=${this.keyGoogleMapsStatic}`;
    },
    link() {
      if (this.col?.value?.link) {
        const { link } = this.col.value;
        let path = `${link.dir}/${link.file}`;

        if (link.dir == null) {
          path = `/${this.dirname(this.path)}/${link.file}`;
        }
        const finalLink = `/auth/app${path}?${this.col.value.linkParameters}`;
        return finalLink.replace('//', '/');
      }
      return false;
    },

    icon() {
      return this.mapIcon(this.col.value.link_icon);
    },
    text() {
      if (this.col.value.link_text !== 'false') {
        return this.col.value.text;
      }
      return ' ';
    },

    innerValue() {
      if (typeof this.col.value === 'object' && this.col.value !== null) {
        return this.col.value.value !== undefined ? this.col.value.value : this.col.value._;
      }

      return this.col.value;
    },
    displayValue() {
      let value =
        this.col.value && this.col.value.value !== undefined
          ? this.col.value.value
          : this.col.value?._
            ? this.col.value._
            : null;
      value = value !== undefined ? value : this.col.value;
      if (this.hasOptions) {
        if (this.checkIsArray(value)) {
          return JSON.parse(value)
            .map((v) => Object.entries(this.hasOptions[v])[0][1])
            .join(', ');
        }
        const option = this.hasOptions[value];
        if (typeof option === 'object') {
          return Object.entries(this.hasOptions[value])[0][1];
        }
        return option;
      }

      if (typeof this.col.value === 'object' && this.col.value !== null) {
        return this.col.value._ ? this.col.value._ : this.col.value.value;
      }

      return this.col.value;
    },
    isAwsUploader() {
      return this.col.value?._ ? this.col.value._.indexOf('awsuploader') !== -1 : false;
    },
    awsData() {
      const test_element = document.createElement('div');
      test_element.innerHTML = this.col.value._;
      let aws = { title: ' ' };

      if (test_element.childNodes[0]) {
        const element = test_element.childNodes[0];
        aws = {
          table: element.getAttributeNode('data-table').value,
          recid: element.getAttributeNode('data-recid').value,
          title: element.innerText
        };
        aws.url = `${this.host()}/uploader/?table=${aws.table}&recid=${aws.recid}&db=${this.currentDb()}`;
      }
      if (test_element.childNodes[1]) {
        const element = test_element.childNodes[1];
        aws = {
          table: element.getAttributeNode('data-table').value,
          recid: element.getAttributeNode('data-recid').value,
          title: element.innerText
        };
        aws.url = `${this.host()}/uploader/?table=${aws.table}&recid=${aws.recid}&db=${this.currentDb()}`;
      }
      return aws;
    },
    formatedValue() {
      // Numeric/Decimal/CustomNumeric/Enclosed*: separadores y decimales del
      // schema, negativos entre paréntesis si data-n-bracket. Sin valor, vacío.
      if (isNumericField(this.schema) && !this.hasOptions) {
        const raw = this.col.value !== null && typeof this.col.value === 'object' ? this.col.value._ : this.col.value;
        return formatNumber(raw, numericSpec(this.schema));
      }
      return this.displayValue;
    },
    hasOptions() {
      return this.schema.options;
    },
    checkIcon() {
      return this.innerValue === 0 ? 'check_box_outline_blank' : 'check';
    },
    isCheck() {
      if (this.schema) {
        return this.schema.histrix_type === 'Check';
      }
      return false;
    }
  },
  methods: {
    checkIsArray(value) {
      try {
        const temp = JSON.parse(value);
        return Array.isArray(temp);
      } catch (_error) {
        return false;
      }
    },
    dirname(path) {
      return path.match(/.*\//);
    },
    mapIcon(icon) {
      // El mapa completo vive en ../core/icons.js (compartido con HistrixForm).
      return mapUiIcon(icon);
    }
  },
  data() {
    return {
      showImage: false
    };
  },
  mounted() {
    //
  }
};
</script>
