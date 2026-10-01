import { describe, expect, it } from 'vitest';

import {
  addDays,
  decodeEntities,
  eventDurationMinutes,
  eventSelectPayload,
  isRangeLoaded,
  mapDefaultView,
  mergeEvents,
  normalizeEvent,
  rangeWithMargin
} from './calendar.js';

describe('addDays', () => {
  it('cruza meses y años', () => {
    expect(addDays('2026-10-01', -7)).toBe('2026-09-24');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});

describe('mapDefaultView', () => {
  it('mapea los nombres de FullCalendar', () => {
    expect(mapDefaultView('month')).toBe('month');
    expect(mapDefaultView('basicWeek')).toBe('week');
    expect(mapDefaultView('agendaWeek')).toBe('week');
    expect(mapDefaultView('agendaDay')).toBe('day');
    expect(mapDefaultView('basicDay')).toBe('day');
  });
  it('gantt se muestra como semana', () => {
    expect(mapDefaultView('gantt')).toBe('week');
  });
  it('vacío o desconocido → mes', () => {
    expect(mapDefaultView(undefined)).toBe('month');
    expect(mapDefaultView('raro')).toBe('month');
  });
});

describe('rangeWithMargin', () => {
  it('agrega una semana a cada lado del rango visible', () => {
    expect(rangeWithMargin('2026-09-27', '2026-11-07')).toEqual({ start: '2026-09-20', end: '2026-11-14' });
  });
});

describe('isRangeLoaded', () => {
  const loaded = [{ start: '2026-09-20', end: '2026-11-14' }];
  it('cubierto por un rango cargado', () => {
    expect(isRangeLoaded(loaded, '2026-10-04', '2026-10-17')).toBe(true);
  });
  it('se sale del rango cargado', () => {
    expect(isRangeLoaded(loaded, '2026-11-01', '2026-12-12')).toBe(false);
    expect(isRangeLoaded([], '2026-10-01', '2026-10-02')).toBe(false);
  });
});

describe('mergeEvents', () => {
  it('no duplica por id+start y conserva los recurrentes', () => {
    const a = [{ id: 1, start: '2026-10-01' }];
    const b = [
      { id: 1, start: '2026-10-01', title: 'nuevo' },
      { id: 1, start: '2026-10-08' }
    ];
    const merged = mergeEvents(a, b);
    expect(merged).toHaveLength(2);
    expect(merged[0].title).toBe('nuevo');
  });
});

describe('decodeEntities', () => {
  it('revierte htmlspecialchars', () => {
    expect(decodeEntities('Juan &amp; Cía &quot;SA&quot; &lt;x&gt; d&#039;a')).toBe('Juan & Cía "SA" <x> d\'a');
    expect(decodeEntities(undefined)).toBe('');
  });
});

describe('normalizeEvent', () => {
  it('evento de día completo', () => {
    const ev = normalizeEvent({ id: 1, title: 'A &amp; B', allDay: true, start: '2026-10-01', end: '2026-10-03' });
    expect(ev).toMatchObject({
      title: 'A & B',
      fulltitle: 'A & B',
      date: '2026-10-01',
      endDate: '2026-10-03',
      time: '',
      endTime: ''
    });
  });
  it('evento con hora', () => {
    const ev = normalizeEvent({
      id: 2,
      title: 'T',
      fulltitle: 'Detalle',
      allDay: false,
      start: '2026-10-01T09:30:00',
      end: '2026-10-01T11:00:00',
      color: '#f00',
      textColor: 'white'
    });
    expect(ev).toMatchObject({ fulltitle: 'Detalle', date: '2026-10-01', time: '09:30', endTime: '11:00' });
    expect(ev.textColor).toBe('white');
    expect(eventDurationMinutes(ev)).toBe(90);
  });
  it('sin end usa start', () => {
    const ev = normalizeEvent({ id: 3, allDay: true, start: '2026-10-05' });
    expect(ev.endDate).toBe('2026-10-05');
  });
});

describe('eventDurationMinutes', () => {
  it('mínimo 30 y corta al fin del día si termina otro día', () => {
    expect(eventDurationMinutes(normalizeEvent({ start: '2026-10-01T10:00:00', end: '2026-10-01T10:00:00' }))).toBe(30);
    expect(eventDurationMinutes(normalizeEvent({ start: '2026-10-01T22:00:00', end: '2026-10-02T02:00:00' }))).toBe(
      120
    );
  });
});

describe('eventSelectPayload', () => {
  const schema = { title: 'x' };
  it('emite la fila con la forma de HistrixTable', () => {
    expect(eventSelectPayload({ dataObject: { id: 5 } }, schema)).toEqual({ row: { id: 5 }, schema });
  });
  it('sin dataObject → null', () => {
    expect(eventSelectPayload({}, schema)).toBeNull();
    expect(eventSelectPayload({ dataObject: [] }, schema)).toBeNull();
  });
});
