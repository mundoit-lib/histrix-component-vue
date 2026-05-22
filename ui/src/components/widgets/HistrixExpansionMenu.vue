<template>
  <div>
    <q-list>
      <template v-if="isRoot && loading">
        <q-item v-for="n in 6" :key="`sk-${n}`">
          <q-item-section avatar>
            <q-skeleton type="QAvatar" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-skeleton type="text" />
          </q-item-section>
        </q-item>
      </template>

      <q-expansion-item
        v-if="isRoot && featured.length"
        v-model="featuredOpen"
        dense
        dense-toggle
        expand-separator
        icon="bolt"
        header-class="text-uppercase text-primary text-weight-medium"
      >
        <template v-slot:header>
          <q-item-section>
            <div class="row items-center">
              <q-icon name="bolt" color="primary" size="sm" class="q-mr-sm" />
              <span>Destacados</span>
              <span class="text-grey-7 q-ml-xs text-caption">({{ featured.length }})</span>
            </div>
          </q-item-section>
        </template>
        <div class="row q-gutter-xs q-px-md q-py-sm featured-zone">
          <q-btn
            v-for="node in featured"
            :key="`feat-${node.menuId}`"
            no-caps
            unelevated
            rounded
            dense
            size="sm"
            color="primary"
            text-color="white"
            align="left"
            :to="nodeUri(node)"
            class="featured-btn"
            @click="refrest(nodeUri(node))"
          >
            <q-icon :name="node.icon || 'star'" size="xs" class="q-mr-xs" />
            <div class="column items-start text-left">
              <span
                class="text-caption capitalize"
                style="line-height: 1.15"
                v-html="decodeHTML(node.label).toLowerCase()"
              />
              <span
                v-if="node.subtitle"
                class="capitalize"
                style="opacity: 0.85; line-height: 1.05; font-size: 0.65rem"
                v-html="decodeHTML(node.subtitle).toLowerCase()"
              />
            </div>
          </q-btn>
        </div>
      </q-expansion-item>

      <q-expansion-item
        v-if="isRoot && isFavorite && favorit.keys.length"
        v-model="favoritesOpen"
        dense
        dense-toggle
        expand-separator
        icon="star"
        header-class="text-uppercase text-weight-medium"
      >
        <template v-slot:header>
          <q-item-section>
            <div class="row items-center">
              <q-icon name="star" color="amber" size="sm" class="q-mr-sm" />
              <span>Favoritos</span>
              <span class="text-grey-7 q-ml-xs text-caption">({{ favorit.keys.length }})</span>
            </div>
          </q-item-section>
        </template>
        <q-item
          v-for="fav in favorit.keys"
          :key="`fav-${fav.menuId}`"
          :to="nodeUri({ uri: fav.uri, label: fav.name })"
          dense
          clickable
          @click="refrest(nodeUri({ uri: fav.uri, label: fav.name }))"
        >
          <q-item-section class="capitalize">
            {{ decodeHTML(fav.name).toLowerCase() }}
          </q-item-section>
          <q-item-section side @click.stop.prevent="toggleFavorit(fav.menuId, fav.uri, fav.name)">
            <q-btn flat round dense color="primary" icon="star" />
          </q-item-section>
        </q-item>
      </q-expansion-item>

      <div v-for="node in data" :key="node.menuId || node.key">
        <q-expansion-item
          v-if="node.children"
          dense
          :content-inset-level="0.2"
          :group="level"
          expand-separator
          :icon="node.icon || undefined"
          :label-lines="1"
          :label="decodeHTML(node.label).toLowerCase()"
          class="capitalize"
        >
          <template v-slot:header>
            <q-item-section avatar>
              <q-icon :name="node.icon || 'arrow_right'" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <span v-html="decodeHTML(node.label).toLowerCase()" />
              </q-item-label>
              <q-item-label
                v-if="node.subtitle"
                caption
                class="capitalize"
              >
                <span v-html="decodeHTML(node.subtitle).toLowerCase()" />
              </q-item-label>
            </q-item-section>
          </template>
          <q-separator />

          <histrixExpansionMenu
            :tree="node.children"
            :favorites="favorit"
            :is-favorite="isFavorite"
            :mini="mini"
            @close-drawer="$emit('close-drawer')"
          />
        </q-expansion-item>

        <q-item
          v-else
          :to="nodeUri(node)"
          @click="refrest(nodeUri(node))"
        >
          <q-item-section avatar>
            <q-icon v-if="node.icon" :name="node.icon" size="sm" />
          </q-item-section>
          <q-item-section class="capitalize">
            <q-item-label>
              {{ decodeHTML(node.label).toLowerCase() }}
            </q-item-label>
            <q-item-label v-if="node.subtitle" caption>
              {{ decodeHTML(node.subtitle).toLowerCase() }}
            </q-item-label>
          </q-item-section>
          <q-item-section
            v-if="isFavorite"
            side
            @click.stop.prevent="toggleFavorit(node.menuId, node.uri, decodeHTML(node.label).toLowerCase())"
          >
            <q-btn
              flat
              round
              color="primary"
              :icon="setIconStart(node.menuId)"
            />
          </q-item-section>
        </q-item>
      </div>
    </q-list>
  </div>
</template>

<script>
import useApi from '../../services/histrixApi.js';

const decodeCache = new Map();
function decodeHTMLcached(text) {
  if (text == null) return '';
  if (decodeCache.has(text)) return decodeCache.get(text);
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const result = doc.documentElement.textContent;
  decodeCache.set(text, result);
  return result;
}

export default {
  name: 'HistrixExpansionMenu',
  emits: ['close-drawer'],
  setup() {
    const { removeFavorit, setFavorit, getFavorites, getMenu } = useApi();
    return {
      apiRemoveFavorit: removeFavorit,
      apiSetFavorit: setFavorit,
      getFavorites,
      getMenu
    };
  },
  props: {
    level: String,
    isFavorite: {
      type: Boolean,
      default: false
    },
    tree: { type: Array, default: null },
    mini: Boolean,
    favorites: {
      type: Object,
      default: () => ({ keys: [] })
    }
  },
  data() {
    return {
      data: [],
      featured: [],
      favorit: { keys: [] },
      loading: true,
      locationCurrent: '',
      featuredOpen: localStorage.getItem('menu.featuredOpen') !== '0',
      favoritesOpen: localStorage.getItem('menu.favoritesOpen') !== '0'
    };
  },
  computed: {
    isRoot() {
      return !this.tree;
    },
    favoritIds() {
      return new Set(this.favorit.keys.map((k) => k.menuId));
    }
  },
  watch: {
    favorites(newval) {
      this.favorit = newval?.keys ? newval : { keys: [] };
    },
    featuredOpen(val) {
      localStorage.setItem('menu.featuredOpen', val ? '1' : '0');
    },
    favoritesOpen(val) {
      localStorage.setItem('menu.favoritesOpen', val ? '1' : '0');
    }
  },
  methods: {
    decodeHTML(text) {
      return decodeHTMLcached(text);
    },
    setIconStart(idMenu) {
      return this.favoritIds.has(idMenu) ? 'star' : 'star_border';
    },
    async toggleFavorit(menuId, uri, name) {
      const exists = this.favoritIds.has(menuId);
      if (exists) {
        await this.apiRemoveFavorit(menuId);
        const index = this.favorit.keys.findIndex((item) => item.menuId === menuId);
        this.favorit.keys.splice(index, 1);
        this.$events.fire('update-favorit');
        return;
      }
      try {
        await this.apiSetFavorit(menuId, uri, name);
        this.$q.notify({
          message: 'Favorito guardado',
          color: 'positive',
          icon: 'check'
        });
        this.favorit.keys.push({ menuId, uri, name });
        this.$events.fire('update-favorit');
      } catch (_error) {
        this.$q.notify({
          message: 'El favorito no se pudo guardar',
          color: 'negative',
          icon: 'warning'
        });
      }
    },
    nodeUri(node) {
      if (!node.uri.includes('vue=')) {
        const path = `/auth/${node.uri}`.replace('//', '/');
        return { path, query: { _title: node.label } };
      }
      const vue = node.uri.match(/vue=(.*?)(&|$)/)[1];
      const path = `/${vue}`.replace(/%2F/g, '/').replace('//', '/');
      return { path };
    },
    getData() {
      if (this.isFavorite) {
        this.getFavorites().then((response) => {
          this.favorit = response;
        });
      }
      this.getMenu(this.level)
        .then((response) => {
          this.loading = false;
          this.data = response.data.tree || [];
          this.featured = response.data.featured || [];
        })
        .catch((err) => {
          this.loading = false;
          console.log(err);
        });
    },
    refrest(url) {
      this.$emit('close-drawer');
      const localitation = location.hash;
      const queryIndex = localitation.indexOf('?');
      const newLocation = localitation.slice(1, queryIndex);
      if (newLocation === this.locationCurrent) {
        this.$router.replace({ ...url, hash: '#update' });
        this.$router.replace({ ...url, hash: ' ', params: { a: 100 } });
        return;
      }
      this.locationCurrent = url.path;
    }
  },
  mounted() {
    if (this.tree) {
      this.data = this.tree;
      this.favorit = this.favorites?.keys ? this.favorites : { keys: [] };
      this.loading = false;
    } else {
      this.getData();
    }
  }
};
</script>

<style scoped>
.capitalize {
  text-transform: capitalize;
}
.featured-btn {
  min-height: 0;
  height: auto;
}
.featured-btn :deep(.q-btn__content) {
  flex-wrap: nowrap;
  padding: 3px 10px;
}
:deep(.q-item__section--avatar) {
  min-width: 32px;
  padding-right: 8px;
}
</style>
