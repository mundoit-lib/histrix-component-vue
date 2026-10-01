<template>
  <q-btn round flat>
    <q-avatar icon="account_circle">
      <q-menu anchor="bottom left" self="top left">
        <q-item>
          <HistrixMenu level="phpmen-fsm" :filter="false"/>
        </q-item>

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

        <q-item tag="a" exact @click="this.exit" class="bg-primary text-white">
          <q-item-section avatar>
            <q-icon :name="'logout'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <span v-text="t('profile.logout')"></span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-menu>
    </q-avatar>
    <q-tooltip>{{ t('profile.account') }}</q-tooltip>
  </q-btn>
</template>

<script>
import useApi from '../../services/histrixApi.js';
import { useHistrixI18n } from '../../services/i18n.js';
import HistrixMenu from './HistrixExpansionMenu.vue';
export default {
  name: 'profileMenu',
  components: {
    HistrixMenu
  },
  setup() {
    const { logout } = useApi();
    return { t: useHistrixI18n().t, logout };
  },
  methods: {
    exit() {
      this.logout();
    }
  },
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
          icon: 'settings',
          label: this.t('profile.settings'),
          caption: this.t('profile.configuration'),
          to: { name: 'systemSettings' }
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
