<template>
  <q-page>
    <q-dialog v-model="displayEvent">
      <q-card v-if="event" style="min-width: 400px">
        <q-toolbar :style="eventStyle(event)">
          <q-toolbar-title class="ellipsis">
            {{ event.title }}
          </q-toolbar-title>
          <q-btn flat round icon="close" v-close-popup></q-btn>
        </q-toolbar>
        <q-card-section class="inset-shadow">
          <div class="text-caption">{{ getEventDate(event) }}</div>
          <div v-if="event.fulltitle && event.fulltitle !== event.title"class="q-mt-sm" style="white-space: pre-line">
            {{ event.fulltitle }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-toolbar>
      <q-toolbar-title>
        <HistrixFilters
          dense
          :schema="schema"
          v-on:filter-data="applyFilter"
        />
      </q-toolbar-title>

      <q-btn
        flat
        dense
        label="Hoy"
        class="q-mx-md"
        @click="calendarToday"
      ></q-btn>
      <q-btn
        flat
        dense
        round
        icon="keyboard_arrow_left"
        @click="calendarPrev"
      ></q-btn>
      <q-btn
        flat
        dense
        round
        icon="keyboard_arrow_right"
        @click="calendarNext"
      ></q-btn>
      <span class="q-mr-xl q-toolbar__title nowrap">{{ title }}</span>
      <q-select
        v-model="calendarView"
        :options="viewOptions"
        outlined
        dense
        options-dense
        emit-value
        map-options
        style="min-width: 120px"
      ></q-select>
    </q-toolbar>

    <q-calendar-month
      v-if="calendarView === 'month'"
      ref="calendar"
      v-model="selectedDate"
      :locale="locale"
      :day-min-height="80"
      bordered
      animated
      @change="onRangeChange"
    >
      <template #day="{ scope: { timestamp } }">
        <q-badge
          v-for="event in getEvents(timestamp.date)"
          :key="`${event.id}|${event.start}`"
          :style="eventStyle(event)"
          class="full-width ellipsis cursor-pointer q-mb-xs"
          @click.stop.prevent="showEvent(event)"
        >
          <span class="ellipsis">
            <template v-if="event.time">{{ event.time }} </template>{{ event.title }}
          </span>
          <q-tooltip>{{ event.fulltitle }}</q-tooltip>
        </q-badge>
      </template>
    </q-calendar-month>

    <q-calendar-day
      v-else
      ref="calendar"
      v-model="selectedDate"
      :view="calendarView"
      :locale="locale"
      bordered
      animated
      @change="onRangeChange"
    >
      <template #head-day-event="{ scope: { timestamp } }">
        <div class="q-pa-xs">
          <q-badge
            v-for="event in getAllDayEvents(timestamp.date)"
            :key="`${event.id}|${event.start}`"
            :style="eventStyle(event)"
            class="full-width ellipsis cursor-pointer q-mb-xs"
            @click.stop.prevent="showEvent(event)"
          >
            <span class="ellipsis">{{ event.title }}</span>
            <q-tooltip>{{ event.fulltitle }}</q-tooltip>
          </q-badge>
        </div>
      </template>
      <template #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }">
        <div
          v-for="event in getTimedEvents(timestamp.date)"
          :key="`${event.id}|${event.start}`"
          class="histrix-calendar-event ellipsis cursor-pointer"
          :style="timedEventStyle(event, timeStartPos, timeDurationHeight)"
          @click.stop.prevent="showEvent(event)"
        >
          <span class="ellipsis">{{ event.time }} {{ event.title }}</span>
          <q-tooltip>{{ event.fulltitle }}</q-tooltip>
        </div>
      </template>
    </q-calendar-day>
  </q-page>
</template>

<script>
import { QCalendarDay, QCalendarMonth, today } from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/index.css';
import {
  eventDurationMinutes,
  eventSelectPayload,
  isRangeLoaded,
  mapDefaultView,
  mergeEvents,
  normalizeEvent,
  rangeWithMargin
} from '../core/calendar.js';
import { backendDateToDisplay } from '../core/dates.js';
import useApi from '../services/histrixApi.js';
import HistrixFilters from './HistrixFilters.vue';

export default {
  name: 'HistrixCalendar',
  setup() {
    const { getData } = useApi();
    return { getData };
  },
  props: {
    schema: {},
    path: null,
    resources: {}
  },
  components: {
    HistrixFilters,
    QCalendarMonth,
    QCalendarDay
  },
  emits: ['update:modelValue', 'select-row'],
  computed: {
    title() {
      if (!this.selectedDate) return '';
      const [y, m, d] = this.selectedDate.split('-').map(Number);
      try {
        return new Intl.DateTimeFormat(this.locale || void 0, { month: 'long', year: 'numeric' }).format(
          new Date(y, m - 1, d)
        );
      } catch (_e) {
        return this.selectedDate.slice(0, 7);
      }
    }
  },
  methods: {
    calendarNext() {
      this.$refs.calendar.next();
    },
    calendarPrev() {
      this.$refs.calendar.prev();
    },
    calendarToday() {
      this.$refs.calendar.moveToToday();
    },
    eventStyle(event) {
      const style = {};
      if (event.color) style.backgroundColor = event.color;
      if (event.textColor) style.color = event.textColor;
      return style;
    },
    timedEventStyle(event, timeStartPos, timeDurationHeight) {
      return {
        ...this.eventStyle(event),
        top: `${timeStartPos(event.time)}px`,
        height: `${timeDurationHeight(eventDurationMinutes(event))}px`
      };
    },
    showEvent(event) {
      this.event = event;
      this.displayEvent = true;
      const payload = eventSelectPayload(event, this.schema);
      if (payload) this.$emit('select-row', payload);
    },
    getEventDate(event) {
      const from = backendDateToDisplay(event.date);
      const to = backendDateToDisplay(event.endDate);
      const start = event.time ? `${from} ${event.time}` : from;
      if (event.endDate === event.date) {
        return event.endTime ? `${start} - ${event.endTime}` : start;
      }
      return `${start} - ${to}${event.endTime ? ` ${event.endTime}` : ''}`;
    },
    xmlUrl(start, end) {
      const query = this.query ? `${this.query}&` : '';
      // HistrixApp deja en schema.api la función apiUrl de useApi (su computed
      // homónimo queda pisado por el de setup), así que se aceptan ambas formas.
      const api = typeof this.schema.api === 'function' ? this.schema.api() : this.schema.api;
      return `${api}/app/${this.path}?${query}_dt=!&start=${start}&end=${end}`;
    },
    onRangeChange({ start, end }) {
      this.visible = { start, end };
      this.loadRange(start, end);
    },
    loadRange(visibleStart, visibleEnd) {
      if (isRangeLoaded(this.loadedRanges, visibleStart, visibleEnd)) return;
      const range = rangeWithMargin(visibleStart, visibleEnd);
      const generation = this.generation;
      this.loadedRanges.push(range);
      this.getData(this.xmlUrl(range.start, range.end))
        .then((response) => {
          // Si cambiaron los filtros mientras volvía, la respuesta ya no vale.
          if (generation !== this.generation) return;
          const incoming = Array.isArray(response.data) ? response.data.map(normalizeEvent) : [];
          this.events = mergeEvents(this.events, incoming);
        })
        .catch((_e) => {
          if (generation !== this.generation) return;
          this.loadedRanges = this.loadedRanges.filter((r) => r !== range);
          this.$q.notify({ type: 'negative', message: 'Error de Carga de Datos' });
        });
    },
    applyFilter(query) {
      this.query = query || '';
      this.generation++;
      this.loadedRanges = [];
      this.events = [];
      if (this.visible) this.loadRange(this.visible.start, this.visible.end);
    },
    getEvents(date) {
      return this.events.filter((ev) => ev.date === date);
    },
    getAllDayEvents(date) {
      return this.events.filter((ev) => !ev.time && ev.date === date);
    },
    getTimedEvents(date) {
      return this.events.filter((ev) => ev.time && ev.date === date);
    }
  },
  beforeMount() {
    this.locale = this.$q.lang.getLocale() || 'es';
  },
  data() {
    return {
      events: [],
      loadedRanges: [],
      visible: null,
      generation: 0,
      query: '',
      selectedDate: today(),
      displayEvent: false,
      event: null,
      locale: undefined,
      calendarView: mapDefaultView(this.schema?.defaultView),
      viewOptions: [
        { label: 'Día', value: 'day' },
        { label: 'Semana', value: 'week' },
        { label: 'Mes', value: 'month' }
      ]
    };
  }
};
</script>
<style>
.histrix-calendar-event {
  position: absolute;
  left: 2px;
  right: 2px;
  padding: 0 4px;
  font-size: 12px;
  border-radius: 4px;
  color: white;
  background-color: var(--q-primary);
}
</style>
