<template>
  <q-list>
       <q-expansion-item
      dense
      :content-inset-level="0.3"
      :_header-inset-level="1"
        group="Personal"
        expand-separator
        icon="person"
        :label-lines="1"
        :label="t('profile.personalSettings')"
        :caption="t('profile.userMenu')"
        class="capitalize"
      >

      <HistrixMenu level="phpmen-fsm" :filter="false" :mini="mini"/>
    
      </q-expansion-item>
        <q-item v-for="item in items" :key="item.to.name" tag="a" :to="item.to">
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <span v-text="item.label"></span>
            </q-item-label>
            <q-item-label caption></q-item-label>
          </q-item-section>
        </q-item>
  </q-list>
</template>

<script>
import { useHistrixI18n } from '../../services/i18n.js';
import HistrixMenu from './HistrixExpansionMenu.vue';

export default {
  name: 'profileMenuItems',
  setup() {
    return { t: useHistrixI18n().t };
  },
  components: {
    HistrixMenu
  },
  props: ['mini'],
  methods: {},
  computed: {
    // Computed (no data) para que cambien con el locale.
    items() {
      return [
        {
          icon: 'person',
          label: this.t('profile.myData'),
          caption: this.t('profile.personalData'),
          to: { name: 'profile' }
        },
        {
          icon: 'info',
          label: this.t('profile.about'),
          caption: this.t('profile.aboutHistrix'),
          to: { name: 'about' }
        }
      ];
    }
  }
};
</script>
