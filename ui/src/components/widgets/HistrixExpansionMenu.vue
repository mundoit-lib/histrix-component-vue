<template>
  <div class="histrix-menu">
    <q-list padding>
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

      <!-- DESTACADOS -->
      <q-expansion-item
        v-if="isRoot && featured.length"
        v-model="featuredOpen"
        dense
        dense-toggle
        :duration="160"
        header-class="menu-section-header"
      >
        <template v-slot:header>
          <q-item-section avatar class="menu-section-avatar">
            <q-icon name="bolt" size="20px" class="menu-section-icon--featured" />
          </q-item-section>
          <q-item-section>
            <div class="menu-section-label menu-section-label--featured">
              <span>Destacados</span>
              <span class="menu-section-count">{{ featured.length }}</span>
            </div>
          </q-item-section>
        </template>

        <div class="featured-zone">
          <q-btn
            v-for="node in featured"
            :key="`feat-${node.menuId}`"
            no-caps
            unelevated
            dense
            size="sm"
            color="primary"
            text-color="white"
            align="left"
            :to="nodeUri(node)"
            class="featured-btn"
            @click="refrest(nodeUri(node))"
          >
            <q-icon :name="node.icon || 'bolt'" size="16px" class="featured-btn-icon" />
            <div class="column items-start text-left">
              <span
                class="featured-btn-label capitalize"
                v-html="decodeHTML(node.label).toLowerCase()"
              />
              <span
                v-if="node.subtitle"
                class="featured-btn-sub capitalize"
                v-html="decodeHTML(node.subtitle).toLowerCase()"
              />
            </div>
          </q-btn>
        </div>
      </q-expansion-item>

      <!-- FAVORITOS -->
      <q-expansion-item
        v-if="isRoot && isFavorite && favorit.keys.length"
        v-model="favoritesOpen"
        dense
        dense-toggle
        :duration="160"
        header-class="menu-section-header"
      >
        <template v-slot:header>
          <q-item-section avatar class="menu-section-avatar">
            <q-icon name="star" size="20px" class="menu-section-icon--fav" />
          </q-item-section>
          <q-item-section>
            <div class="menu-section-label menu-section-label--fav">
              <span>Favoritos</span>
              <span class="menu-section-count">{{ favorit.keys.length }}</span>
            </div>
          </q-item-section>
        </template>

        <q-item
          v-for="fav in favorit.keys"
          :key="`fav-${fav.menuId}`"
          :to="nodeUri({ uri: fav.uri, label: fav.name })"
          dense
          clickable
          class="menu-leaf"
          @click="refrest(nodeUri({ uri: fav.uri, label: fav.name }))"
        >
          <q-item-section class="capitalize menu-leaf-label">
            {{ decodeHTML(fav.name).toLowerCase() }}
          </q-item-section>
          <q-item-section
            side
            class="fav-star fav-star--active"
            @click.stop.prevent="toggleFavorit(fav.menuId, fav.uri, fav.name)"
          >
            <q-btn flat round dense icon="star" class="fav-star-btn" aria-label="Quitar de favoritos" />
          </q-item-section>
        </q-item>
      </q-expansion-item>

      <q-separator
        v-if="isRoot && (featured.length || (isFavorite && favorit.keys.length))"
        class="menu-divider"
      />

      <!-- ÁRBOL DE NAVEGACIÓN -->
      <div v-for="node in data" :key="node.menuId || node.key">
        <q-expansion-item
          v-if="node.children"
          dense
          :content-inset-level="0.2"
          :group="level"
          :duration="160"
          :label-lines="1"
          header-class="menu-branch"
        >
          <template v-slot:header>
            <q-item-section avatar class="menu-branch-avatar">
              <q-icon :name="node.icon || 'folder_open'" size="20px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="menu-branch-label capitalize">
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
          class="menu-leaf"
          @click="refrest(nodeUri(node))"
        >
          <q-item-section avatar class="menu-leaf-avatar">
            <q-icon v-if="node.icon" :name="node.icon" size="20px" />
            <span v-else class="menu-leaf-dot" />
          </q-item-section>
          <q-item-section class="capitalize menu-leaf-label">
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
            class="fav-star"
            :class="{ 'fav-star--active': favoritIds.has(node.menuId) }"
            @click.stop.prevent="toggleFavorit(node.menuId, node.uri, decodeHTML(node.label).toLowerCase())"
          >
            <q-btn
              flat
              round
              dense
              :icon="setIconStart(node.menuId)"
              class="fav-star-btn"
              :aria-label="favoritIds.has(node.menuId) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
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
          console.error(err);
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
.histrix-menu {
  /* Dorado de favoritos: con presencia sobre fondo claro, no el amarillo plano de Quasar */
  --fav-gold: #f59e0b;
}

.capitalize {
  text-transform: capitalize;
}

/* ───────────── Cabeceras de sección (Destacados / Favoritos) ───────────── */
.histrix-menu :deep(.menu-section-header) {
  min-height: 34px;
  padding-left: 12px;
  padding-right: 8px;
}
.menu-section-avatar {
  min-width: 28px;
  padding-right: 6px;
}
.menu-section-icon--featured {
  color: var(--q-primary);
}
.menu-section-icon--fav {
  color: var(--fav-gold);
}
.menu-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.menu-section-label--featured {
  color: var(--q-primary);
}
.menu-section-label--fav {
  color: var(--fav-gold);
}
.menu-section-count {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.16);
  border-radius: 999px;
  padding: 0 6px;
  line-height: 1.5;
}

/* ───────────── Píldoras de destacados ───────────── */
.featured-zone {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 12px 10px;
}
.featured-btn {
  min-height: 0;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.14), 0 1px 1px rgba(15, 23, 42, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.featured-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.2);
}
.featured-btn:active {
  transform: translateY(0);
}
.featured-btn :deep(.q-btn__content) {
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
}
.featured-btn-icon {
  opacity: 0.9;
}
.featured-btn-label {
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}
.featured-btn-sub {
  font-size: 0.62rem;
  line-height: 1.1;
  opacity: 0.82;
}

/* ───────────── Separador ───────────── */
.menu-divider {
  margin: 6px 12px;
  opacity: 0.6;
}

/* ───────────── Ramas (secciones con hijos) ───────────── */
.histrix-menu :deep(.menu-branch) {
  min-height: 40px;
  border-radius: 8px;
  margin: 1px 8px;
  transition: background 0.15s ease;
}
.histrix-menu :deep(.menu-branch:hover) {
  background: rgba(15, 23, 42, 0.045);
}
.menu-branch-avatar {
  min-width: 28px;
  padding-right: 8px;
}
.menu-branch-avatar :deep(.q-icon) {
  color: #64748b;
}
.menu-branch-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
}

/* ───────────── Hojas (items finales) ───────────── */
.menu-leaf {
  position: relative;
  border-radius: 8px;
  margin: 1px 8px;
  min-height: 36px;
  transition: background 0.15s ease, color 0.15s ease;
}
.menu-leaf:hover {
  background: rgba(15, 23, 42, 0.045);
}
.menu-leaf-avatar {
  min-width: 28px;
  padding-right: 8px;
}
.menu-leaf-avatar :deep(.q-icon) {
  color: #64748b;
}
/* Título de la hoja (no el subtítulo, que se mantiene como caption más chico y gris) */
.menu-leaf-label :deep(.q-item__label:not(.q-item__label--caption)) {
  font-size: 0.8rem;
  color: #334155;
}
.menu-leaf-label :deep(.q-item__label--caption) {
  font-size: 0.7rem;
  line-height: 1.2;
}
.menu-leaf-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #cbd5e1;
  margin-left: 7px;
  transition: background 0.15s ease;
}
.menu-leaf:hover .menu-leaf-dot {
  background: #94a3b8;
}

/* Item de la ruta activa: riel lateral + fondo teñido con el color de marca */
.menu-leaf.q-router-link--active {
  background: color-mix(in srgb, var(--q-primary) 11%, white);
}
.menu-leaf.q-router-link--active .menu-leaf-label :deep(.q-item__label:not(.q-item__label--caption)) {
  color: var(--q-primary);
  font-weight: 600;
}
.menu-leaf.q-router-link--active .menu-leaf-dot {
  background: var(--q-primary);
}
.menu-leaf.q-router-link--active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  height: 56%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--q-primary);
}

/* ───────────── Estrella de favorito ─────────────
   Oculta por defecto. Aparece al pasar el mouse, al enfocar con teclado,
   en el item activo, o cuando ya es favorito (siempre visible y dorada). */
.fav-star {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.menu-leaf:hover .fav-star,
.menu-leaf:focus-within .fav-star,
.menu-leaf.q-router-link--active .fav-star,
.fav-star--active {
  opacity: 1;
  transform: scale(1);
}
.fav-star-btn {
  color: #b6c0cf;
  transition: color 0.16s ease, transform 0.16s ease;
}
.fav-star:hover .fav-star-btn {
  color: var(--fav-gold);
  transform: scale(1.12);
}
.fav-star--active .fav-star-btn {
  color: var(--fav-gold);
}

/* Dispositivos táctiles (sin hover): mantener visibles para que sean alcanzables */
@media (hover: none) {
  .fav-star {
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.q-item__section--avatar) {
  min-width: 28px;
  padding-right: 8px;
}
</style>
