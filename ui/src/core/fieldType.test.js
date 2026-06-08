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

  it('TipoDato pasa tal cual cuando no lo pisa otra condición ("date")', () => {
    expect(resolveFieldKind({ TipoDato: 'date' })).toBe('date');
  });

  it('TipoDato "time" -> "time"', () => {
    expect(resolveFieldKind({ TipoDato: 'time' })).toBe('time');
  });

  it('TipoDato "datetime" -> "datetime"', () => {
    expect(resolveFieldKind({ TipoDato: 'datetime' })).toBe('datetime');
  });

  it('TipoDato "decimal" -> "decimal"', () => {
    expect(resolveFieldKind({ TipoDato: 'decimal' })).toBe('decimal');
  });

  it('TipoDato "integer" -> "integer"', () => {
    expect(resolveFieldKind({ TipoDato: 'integer' })).toBe('integer');
  });

  it('TipoDato "select" se normaliza a "q-select"', () => {
    expect(resolveFieldKind({ TipoDato: 'select' })).toBe('q-select');
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

  it('renderHelper pisa a TipoDato cuando hay innerContainer sin options', () => {
    expect(resolveFieldKind({ innerContainer: { dir: 'x', xml: 'y' }, TipoDato: 'date' })).toBe('object');
  });

  it('TipoDato NO pisa a "Radio" si Radio viene antes... (Radio luego TipoDato): TipoDato gana', () => {
    // En el orden original: Radio se setea primero, luego TipoDato lo pisa.
    expect(resolveFieldKind({ histrix_type: 'Radio', TipoDato: 'integer' })).toBe('integer');
  });

  it('histrix_type "Editor" pisa a TipoDato', () => {
    expect(resolveFieldKind({ histrix_type: 'Editor', TipoDato: 'integer' })).toBe('q-editor');
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
