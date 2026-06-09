<template>
  <span class="hms-root">
    <!-- ───────────── TRIGGER ─────────────
         variant="input"  → barra "Buscar…" con atajo (ideal para el header)
         variant="button" → solo ícono lupa (headers compactos / mobile) -->
    <button
      v-if="variant === 'input'"
      type="button"
      class="hms-trigger"
      :aria-label="placeholder"
      @click="open = true"
    >
      <q-icon name="search" size="18px" class="hms-trigger-icon" />
      <span class="hms-trigger-text">{{ placeholder }}</span>
      <span v-if="shortcut" class="hms-kbd">{{ shortcutLabel }}</span>
    </button>
    <q-btn
      v-else
      flat
      round
      dense
      icon="search"
      :aria-label="placeholder"
      @click="open = true"
    />

    <!-- ───────────── PALETTE ───────────── -->
    <q-dialog
      v-model="open"
      position="top"
      transition-show="jump-down"
      transition-hide="jump-up"
      @show="onShow"
    >
      <div class="hms-panel" @keydown="onKey">
        <div class="hms-search">
          <q-icon name="search" size="20px" class="hms-search-icon" />
          <input
            ref="input"
            v-model="query"
            class="hms-input"
            type="text"
            :placeholder="placeholder"
            autocomplete="off"
            spellcheck="false"
            aria-label="Buscar en el menú"
          />
          <span v-if="loading" class="hms-loading"><q-spinner size="18px" /></span>
          <button
            v-else-if="query"
            type="button"
            class="hms-clear"
            aria-label="Limpiar búsqueda"
            @click="clearQuery"
          >
            <q-icon name="close" size="16px" />
          </button>
        </div>

        <div ref="results" class="hms-results">
          <template v-if="results.length">
            <div
              v-for="(r, i) in results"
              :key="r.menuId ?? `r-${i}`"
              class="hms-item"
              :class="{ 'hms-item--active': i === active }"
              @mousemove="active = i"
              @click="go(r)"
            >
              <span class="hms-item-icon">
                <q-icon :name="r.icon || 'description'" size="18px" />
              </span>
              <div class="hms-item-body">
                <div class="hms-item-label" v-html="highlight(r.display)" />
                <div v-if="r.path.length" class="hms-item-path">
                  <span v-for="(p, pi) in r.path" :key="pi" class="hms-crumb">
                    <span v-html="highlight(p)" />
                    <q-icon
                      v-if="pi < r.path.length - 1"
                      name="chevron_right"
                      size="13px"
                      class="hms-crumb-sep"
                    />
                  </span>
                </div>
                <div
                  v-else-if="r.subtitle"
                  class="hms-item-path"
                  v-html="highlight(r.subtitle)"
                />
              </div>
              <q-icon name="keyboard_return" size="15px" class="hms-item-enter" />
            </div>
          </template>

          <div v-else-if="query" class="hms-empty">
            <q-icon name="search_off" size="30px" class="hms-empty-icon" />
            <div>Sin resultados para <strong>«{{ query }}»</strong></div>
          </div>
          <div v-else class="hms-empty">
            <q-icon name="travel_explore" size="30px" class="hms-empty-icon" />
            <div>Escribí para buscar en el menú…</div>
          </div>
        </div>

        <div class="hms-footer">
          <span class="hms-hint"><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span class="hms-hint"><kbd>↵</kbd> abrir</span>
          <span class="hms-hint"><kbd>esc</kbd> cerrar</span>
          <span class="hms-spacer" />
          <span v-if="results.length" class="hms-count">
            {{ results.length }} resultado{{ results.length === 1 ? '' : 's' }}
          </span>
        </div>
      </div>
    </q-dialog>
  </span>
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

// Pliega un string a su forma "buscable": minúsculas y sin tildes/diacríticos.
// Devuelve también un mapa folded→original para poder resaltar el match sobre
// el texto original (ej: buscar "vigil" resalta "Vigil" en "Vigilancia").
function fold(input) {
  const s = (input || '').toLowerCase();
  let folded = '';
  const map = [];
  for (let i = 0; i < s.length; i++) {
    const f = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (let j = 0; j < f.length; j++) {
      folded += f[j];
      map.push(i);
    }
  }
  return { folded, map };
}
function foldStr(input) {
  return fold(input).folded;
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}
// Pasa a "Título Como El Menú" en JS (no por CSS): así el texto ya tiene el
// caso correcto antes de insertar el <mark>, y el resaltado no parte la palabra
// dejando mayúsculas raras tipo "MonEdas".
function titleCase(input) {
  return (input || '')
    .toLowerCase()
    .replace(/(^|[\s/(\-–—])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
}

export default {
  name: 'HistrixMenuSearch',
  emits: ['navigate'],
  setup() {
    const { getMenu } = useApi();
    return { getMenu };
  },
  props: {
    // Nivel del menú para pedir el árbol (igual que HistrixExpansionMenu).
    level: { type: String, default: '' },
    // Árbol ya cargado; si se pasa, evita el fetch (reusar el del drawer).
    tree: { type: Array, default: null },
    // 'input' (barra con atajo) | 'button' (solo lupa)
    variant: { type: String, default: 'input' },
    placeholder: { type: String, default: 'Buscar…' },
    // Atajo global Cmd/Ctrl + K para abrir desde cualquier lado.
    shortcut: { type: Boolean, default: true },
    // Máximo de resultados a mostrar.
    limit: { type: Number, default: 40 }
  },
  data() {
    return {
      open: false,
      query: '',
      active: 0,
      items: [],
      loading: false,
      isMac:
        typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')
    };
  },
  computed: {
    shortcutLabel() {
      return this.isMac ? '⌘ K' : 'Ctrl K';
    },
    results() {
      const q = foldStr(this.query.trim());
      if (!q) return [];
      const scored = [];
      for (const it of this.items) {
        let score = -1;
        let pos = it._labelF.indexOf(q);
        if (pos === 0) score = 0; // empieza con
        else if (pos > 0 && /\s/.test(it._labelF[pos - 1])) score = 1; // inicio de palabra
        else if (pos > 0) score = 2; // contiene (label)
        else if (it._subF.includes(q)) score = 3; // subtítulo
        else if (it._pathF.includes(q)) score = 4; // ruta/breadcrumb
        if (score >= 0) {
          scored.push({ it, score, pos: pos < 0 ? 9999 : pos });
        }
      }
      scored.sort(
        (a, b) =>
          a.score - b.score ||
          a.pos - b.pos ||
          a.it.display.length - b.it.display.length
      );
      return scored.slice(0, this.limit).map((s) => s.it);
    }
  },
  watch: {
    query() {
      this.active = 0;
    },
    tree() {
      this.loadData();
    }
  },
  methods: {
    decodeHTML(text) {
      return decodeHTMLcached(text);
    },
    flatten(nodes, path = []) {
      const out = [];
      for (const n of nodes || []) {
        const display = this.decodeHTML(n.label || '');
        if (n.uri) {
          const subtitle = this.decodeHTML(n.subtitle || '');
          out.push({
            menuId: n.menuId,
            display,
            subtitle,
            icon: n.icon || '',
            uri: n.uri,
            path: [...path],
            _labelF: foldStr(display),
            _subF: foldStr(subtitle),
            _pathF: foldStr(path.join(' '))
          });
        }
        if (n.children && n.children.length) {
          out.push(...this.flatten(n.children, [...path, display]));
        }
      }
      return out;
    },
    loadData() {
      if (this.tree && this.tree.length) {
        this.items = this.flatten(this.tree);
        return;
      }
      if (!this.level) return;
      this.loading = true;
      this.getMenu(this.level)
        .then((res) => {
          this.items = this.flatten(res?.data?.tree || []);
          this.loading = false;
        })
        .catch((err) => {
          this.loading = false;
          console.error(err);
        });
    },
    // Resalta el tramo coincidente sobre el texto ya capitalizado (insensible a
    // tildes). Como el texto viene con el caso final, el <mark> no altera mayúsculas.
    highlight(text) {
      const display = titleCase(text);
      const q = foldStr(this.query.trim());
      if (!q) return escapeHTML(display);
      const { folded, map } = fold(display);
      const i = folded.indexOf(q);
      if (i < 0) return escapeHTML(display);
      const start = map[i];
      const end = map[i + q.length - 1] + 1;
      return (
        escapeHTML(display.slice(0, start)) +
        '<mark>' +
        escapeHTML(display.slice(start, end)) +
        '</mark>' +
        escapeHTML(display.slice(end))
      );
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
    go(r) {
      this.open = false;
      this.$emit('navigate', r);
      this.$router
        .push(this.nodeUri({ uri: r.uri, label: r.display }))
        .catch(() => {});
    },
    move(delta) {
      const n = this.results.length;
      if (!n) return;
      this.active = (this.active + delta + n) % n;
      this.scrollActive();
    },
    scrollActive() {
      this.$nextTick(() => {
        const el = this.$refs.results?.querySelector('.hms-item--active');
        if (el) el.scrollIntoView({ block: 'nearest' });
      });
    },
    onKey(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.move(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = this.results[this.active];
        if (r) this.go(r);
      } else if (e.key === 'Home') {
        this.active = 0;
        this.scrollActive();
      } else if (e.key === 'End') {
        this.active = this.results.length - 1;
        this.scrollActive();
      }
    },
    onShow() {
      this.active = 0;
      this.$nextTick(() => this.$refs.input?.focus());
    },
    clearQuery() {
      this.query = '';
      this.$refs.input?.focus();
    },
    onGlobalKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        this.open = true;
      }
    }
  },
  mounted() {
    this.loadData();
    if (this.shortcut && typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onGlobalKey);
    }
  },
  beforeUnmount() {
    if (this.shortcut && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onGlobalKey);
    }
  }
};
</script>

<style scoped>
.hms-root {
  display: inline-flex;
}

/* ───────────── Trigger ─────────────
   Pensado para vivir en un header de color (texto blanco): usa blancos
   semitransparentes que se ven bien sobre el color de marca. */
.hms-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  min-width: 220px;
  padding: 0 8px 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  border-radius: 9px;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.hms-trigger:hover {
  background: rgba(255, 255, 255, 0.24);
}
.hms-trigger-icon {
  opacity: 0.9;
}
.hms-trigger-text {
  flex: 1;
  text-align: left;
  opacity: 0.85;
}
.hms-kbd {
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 5px;
  border: 1px solid currentColor;
  opacity: 0.6;
  white-space: nowrap;
}

/* ───────────── Panel ───────────── */
.hms-panel {
  width: 92vw;
  max-width: 560px;
  margin-top: 9vh;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.32), 0 4px 12px rgba(15, 23, 42, 0.16);
}

/* Barra de búsqueda */
.hms-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef1f5;
}
.hms-search-icon {
  flex: none;
  color: var(--q-primary);
}
.hms-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 1.05rem;
  color: #1e293b;
}
.hms-input::placeholder {
  color: #94a3b8;
}
.hms-loading {
  display: inline-flex;
  color: var(--q-primary);
}
.hms-clear {
  flex: none;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}
.hms-clear:hover {
  background: #e2e8f0;
}

/* Resultados */
.hms-results {
  overflow-y: auto;
  padding: 6px;
}
.hms-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 9px;
  cursor: pointer;
}
.hms-item--active {
  background: color-mix(in srgb, var(--q-primary) 12%, white);
}
.hms-item-icon {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}
.hms-item--active .hms-item-icon {
  background: var(--q-primary);
  color: #fff;
}
.hms-item-body {
  flex: 1;
  min-width: 0;
}
.hms-item-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hms-item--active .hms-item-label {
  color: var(--q-primary);
}
.hms-item-path {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 1px;
  font-size: 0.72rem;
  color: #94a3b8;
}
.hms-crumb {
  display: inline-flex;
  align-items: center;
}
.hms-crumb-sep {
  color: #cbd5e1;
  margin: 0 1px;
}
.hms-item-enter {
  flex: none;
  color: #cbd5e1;
  opacity: 0;
}
.hms-item--active .hms-item-enter {
  opacity: 1;
  color: var(--q-primary);
}
.hms-item :deep(mark) {
  background: color-mix(in srgb, var(--q-primary) 22%, transparent);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
  font-weight: 700;
}

/* Estado vacío */
.hms-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  font-size: 0.88rem;
  color: #94a3b8;
}
.hms-empty-icon {
  color: #cbd5e1;
}

/* Footer con atajos */
.hms-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 14px;
  border-top: 1px solid #eef1f5;
  background: #fafbfc;
  font-size: 0.72rem;
  color: #94a3b8;
}
.hms-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.hms-footer kbd {
  font-family: inherit;
  font-size: 0.7rem;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-bottom-width: 2px;
  border-radius: 5px;
  color: #64748b;
}
.hms-spacer {
  flex: 1;
}
</style>
