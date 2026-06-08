import { describe, expect, it } from 'vitest';

import { backendDateToDisplay, dateSortParts, displayDateToBackend, formatLocal } from './dates.js';

// Estos tests asumen TZ=UTC (fijado en vitest.config.js) para que el ajuste de
// timezone sea 0 y el resultado sea determinista. La validación en huso real
// (Argentina) se hace en el playground.

describe('formatLocal', () => {
  it('formatea DD/MM/YYYY con padding', () => {
    expect(formatLocal(new Date(2024, 0, 5), 'DD/MM/YYYY')).toBe('05/01/2024');
  });

  it('formatea YYYY-MM-DD con padding', () => {
    expect(formatLocal(new Date(2024, 0, 5), 'YYYY-MM-DD')).toBe('2024-01-05');
  });

  it('devuelve "" ante un Date inválido', () => {
    expect(formatLocal(new Date('xxx'), 'DD/MM/YYYY')).toBe('');
  });
});

describe('backendDateToDisplay', () => {
  it('convierte dd/mm/yyyy del backend a display DD/MM/YYYY', () => {
    expect(backendDateToDisplay('15/01/2024')).toBe('15/01/2024');
  });

  it('devuelve undefined si está vacío o es falsy', () => {
    expect(backendDateToDisplay('')).toBeUndefined();
    expect(backendDateToDisplay(null)).toBeUndefined();
    expect(backendDateToDisplay(undefined)).toBeUndefined();
  });

  it('devuelve el valor crudo si no mide 10 (p. ej. el "-2" de §8.2)', () => {
    expect(backendDateToDisplay('-2')).toBe('-2');
    expect(backendDateToDisplay('2024-01-1')).toBe('2024-01-1');
  });

  it('acepta también ISO de 10 chars (sin "/")', () => {
    expect(backendDateToDisplay('2024-01-15')).toBe('15/01/2024');
  });
});

describe('displayDateToBackend', () => {
  it('convierte display DD/MM/YYYY a ISO YYYY-MM-DD', () => {
    expect(displayDateToBackend('15/01/2024')).toEqual({ passthrough: false, value: '2024-01-15' });
  });

  it('pasa crudo (passthrough) si el display no mide 10', () => {
    expect(displayDateToBackend('15/1/24')).toEqual({ passthrough: true, value: '15/1/24' });
    expect(displayDateToBackend('')).toEqual({ passthrough: true, value: '' });
  });

  it('round-trip backend → display → backend es estable', () => {
    const display = backendDateToDisplay('2024-03-09');
    expect(display).toBe('09/03/2024');
    expect(displayDateToBackend(display).value).toBe('2024-03-09');
  });
});

describe('dateSortParts', () => {
  it('descompone dd/mm/yyyy en [year, month+1, day] (preserva el +1 original)', () => {
    expect(dateSortParts('15/01/2024')).toEqual(['2024', 2, '15']);
  });
});
