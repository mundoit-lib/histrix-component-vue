import { describe, expect, it } from 'vitest';
import { UI_ICON_MAP, mapUiIcon } from './icons.js';

describe('mapUiIcon', () => {
  it('traduce íconos con equivalente Material', () => {
    expect(mapUiIcon('ui-icon-plusthick')).toBe('add');
    expect(mapUiIcon('ui-icon-plus')).toBe('add');
    expect(mapUiIcon('ui-icon-print')).toBe('print');
    expect(mapUiIcon('ui-icon-trash')).toBe('delete');
    expect(mapUiIcon('ui-icon-alert')).toBe('');
  });

  it('devuelve string vacío para íconos sin equivalente (comportamiento original)', () => {
    expect(mapUiIcon('ui-icon-search')).toBe('');
    expect(mapUiIcon('ui-icon-star')).toBe('');
  });

  it('devuelve undefined para íconos no mapeados', () => {
    expect(mapUiIcon('ui-icon-inexistente')).toBeUndefined();
    expect(mapUiIcon('')).toBeUndefined();
    expect(mapUiIcon(undefined)).toBeUndefined();
  });

  it('expone el mapa completo', () => {
    expect(UI_ICON_MAP['ui-icon-plusthick']).toBe('add');
    expect(Object.keys(UI_ICON_MAP).length).toBeGreaterThan(150);
  });
});
