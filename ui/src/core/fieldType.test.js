import { describe, expect, it } from 'vitest';

import { hasOptions, renderHelper, resolveFieldKind } from './fieldType.js';

describe('resolveFieldKind', () => {
  it('cae a "q-input" por defecto cuando el schema está vacío', () => {
    expect(resolveFieldKind({})).toBe('q-input');
  });

  it('respeta un default custom (this.type del componente)', () => {
    expect(resolveFieldKind({}, 'otro')).toBe('otro');
  });

  it('es robusto ante fieldSchema null/undefined', () => {
    expect(resolveFieldKind(null)).toBe('q-input');
    expect(resolveFieldKind(undefined)).toBe('q-input');
  });

  it('detecta select por options_sorted', () => {
    expect(resolveFieldKind({ options_sorted: { 1: 'A', 2: 'B' } })).toBe('q-select');
  });

  it('detecta select por options', () => {
    expect(resolveFieldKind({ options: { 1: 'A' } })).toBe('q-select');
  });

  it('detecta select por isSelect', () => {
    expect(resolveFieldKind({ isSelect: true })).toBe('q-select');
  });

  it('NO es select si options está vacío', () => {
    expect(resolveFieldKind({ options: {} })).toBe('q-input');
  });

  it('prioriza options_sorted sobre options (?? operator)', () => {
    // options_sorted vacío -> no es select aunque options tenga datos
    expect(resolveFieldKind({ options_sorted: {}, options: { 1: 'A' } })).toBe('q-input');
  });

  it('histrix_type "Radio" -> "radio"', () => {
    expect(resolveFieldKind({ histrix_type: 'Radio' })).toBe('radio');
  });

  it('histrix_type "File" -> "q-file"', () => {
    expect(resolveFieldKind({ histrix_type: 'File' })).toBe('q-file');
  });

  it('histrix_type "Editor" -> "q-editor"', () => {
    expect(resolveFieldKind({ histrix_type: 'Editor' })).toBe('q-editor');
  });

  it('histrix_type "Check" -> "check"', () => {
    expect(resolveFieldKind({ histrix_type: 'Check' })).toBe('check');
  });

  it('histrix_type "Flipswitch" -> "toggle"', () => {
    expect(resolveFieldKind({ histrix_type: 'Flipswitch' })).toBe('toggle');
  });

  it('acepta el histrix_type en cualquier grafía', () => {
    expect(resolveFieldKind({ histrix_type: 'check' })).toBe('check');
    expect(resolveFieldKind({ histrix_type: 'FILE' })).toBe('q-file');
  });

  it('Simpleditor -> "q-editor"', () => {
    expect(resolveFieldKind({ histrix_type: 'Simpleditor' })).toBe('q-editor');
  });

  it('tipos de dato: Date/Time/Datetime/Integer/Email', () => {
    expect(resolveFieldKind({ histrix_type: 'Date', 'data-role': 'datebox' })).toBe('date');
    expect(resolveFieldKind({ histrix_type: 'Time', mask: '99:99:99' })).toBe('time');
    expect(resolveFieldKind({ histrix_type: 'Hora' })).toBe('time');
    expect(resolveFieldKind({ histrix_type: 'Datetime' })).toBe('datetime');
    expect(resolveFieldKind({ histrix_type: 'Integer', type: 'number' })).toBe('integer');
    expect(resolveFieldKind({ histrix_type: 'Email', type: 'email' })).toBe('email');
  });

  it('Decimal y sus variantes -> "decimal"', () => {
    expect(resolveFieldKind({ histrix_type: 'Decimal', type: 'text', step: '0.01' })).toBe('decimal');
    expect(resolveFieldKind({ histrix_type: 'CustomNumeric', 'data-a-dec': ',' })).toBe('decimal');
    expect(resolveFieldKind({ histrix_type: 'EnclosedNumeric' })).toBe('decimal');
    expect(resolveFieldKind({ histrix_type: 'Hfloat' })).toBe('decimal');
    expect(resolveFieldKind({ histrix_type: 'Numeric' })).toBe('decimal');
    expect(resolveFieldKind({ histrix_type: 'EnclosedInteger' })).toBe('integer');
  });

  it('tipos sin tratamiento propio caen al default', () => {
    expect(resolveFieldKind({ histrix_type: 'Varchar' })).toBe('q-input');
    expect(resolveFieldKind({ histrix_type: 'Field' })).toBe('q-input');
  });

  it('renderHelper: innerContainer sin options -> "object"', () => {
    expect(resolveFieldKind({ innerContainer: { dir: 'x', xml: 'y' } })).toBe('object');
  });

  it('innerContainer CON options -> NO es object, gana select', () => {
    expect(resolveFieldKind({ innerContainer: { dir: 'x', xml: 'y' }, options: { 1: 'A' } })).toBe('q-select');
  });

  // --- Prioridad / orden de las condiciones (el último if que matchea gana) ---

  it('histrix_type "File" pisa a un select con options', () => {
    expect(resolveFieldKind({ options: { 1: 'A' }, histrix_type: 'File' })).toBe('q-file');
  });

  it('histrix_type "File" pisa a renderHelper (object)', () => {
    expect(resolveFieldKind({ innerContainer: { dir: 'x', xml: 'y' }, histrix_type: 'File' })).toBe('q-file');
  });

  it('histrix_type "Flipswitch" pisa a "Check" (último if gana)', () => {
    // ambos no pueden ser strings distintos a la vez, pero validamos el orden:
    // Flipswitch es la última condición evaluada.
    expect(resolveFieldKind({ histrix_type: 'Flipswitch' })).toBe('toggle');
  });

  it('un select con histrix_type de dato sigue siendo select (FK Integer)', () => {
    expect(resolveFieldKind({ histrix_type: 'Integer', options: { 1: 'A' } })).toBe('q-select');
    expect(resolveFieldKind({ histrix_type: 'Date', isSelect: true })).toBe('q-select');
  });

  it('renderHelper pisa a un tipo de dato', () => {
    expect(resolveFieldKind({ innerContainer: { dir: 'x', xml: 'y' }, histrix_type: 'Date' })).toBe('object');
  });

  it('Radio pisa a select', () => {
    expect(resolveFieldKind({ histrix_type: 'Radio', options: { 1: 'A' } })).toBe('radio');
  });
});

describe('hasOptions', () => {
  it('true con options_sorted no vacío', () => {
    expect(hasOptions({ options_sorted: { 1: 'A' } })).toBe(true);
  });
  it('true con options no vacío', () => {
    expect(hasOptions({ options: { 1: 'A' } })).toBe(true);
  });
  it('true con isSelect', () => {
    expect(hasOptions({ isSelect: true })).toBe(true);
  });
  it('false con options vacío', () => {
    expect(hasOptions({ options: {} })).toBe(false);
  });
  it('false con schema vacío', () => {
    expect(hasOptions({})).toBe(false);
  });
  it('robusto ante null', () => {
    expect(hasOptions(null)).toBe(false);
  });
});

describe('renderHelper', () => {
  it('true con innerContainer y sin options', () => {
    expect(renderHelper({ innerContainer: { dir: 'x' } })).toBe(true);
  });
  it('false con innerContainer pero con options', () => {
    expect(renderHelper({ innerContainer: { dir: 'x' }, options: { 1: 'A' } })).toBe(false);
  });
  it('false sin innerContainer', () => {
    expect(renderHelper({})).toBe(false);
  });
});
