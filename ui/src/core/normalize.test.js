import { describe, expect, it } from 'vitest';

import { normalizeFieldType, normalizeScreenType } from './normalize.js';

describe('normalizeScreenType', () => {
  it('pasa a minúsculas y saca los guiones, como el backend', () => {
    expect(normalizeScreenType('liveGrid')).toBe('livegrid');
    expect(normalizeScreenType('livegrid')).toBe('livegrid');
    expect(normalizeScreenType('live-grid')).toBe('livegrid');
    expect(normalizeScreenType('abm-mini')).toBe('abmmini');
    expect(normalizeScreenType('abmmini')).toBe('abmmini');
    expect(normalizeScreenType('horizontalGrid')).toBe('horizontalgrid');
    expect(normalizeScreenType('TreeTable')).toBe('treetable');
    expect(normalizeScreenType('treeView')).toBe('treeview');
  });

  it('corrige los typos de XML reales', () => {
    expect(normalizeScreenType('Consulta')).toBe('consulta');
    expect(normalizeScreenType('consula')).toBe('consulta');
    expect(normalizeScreenType('dalete')).toBe('delete');
    expect(normalizeScreenType('cards')).toBe('card');
  });

  it('tolera espacios alrededor', () => {
    expect(normalizeScreenType(' ficha ')).toBe('ficha');
  });

  it('devuelve "" sin tipo', () => {
    expect(normalizeScreenType('')).toBe('');
    expect(normalizeScreenType(undefined)).toBe('');
    expect(normalizeScreenType(null)).toBe('');
    expect(normalizeScreenType(3)).toBe('');
  });
});

describe('normalizeFieldType', () => {
  it('pasa el PascalCase del backend a minúsculas', () => {
    expect(normalizeFieldType('Decimal')).toBe('decimal');
    expect(normalizeFieldType('Email')).toBe('email');
    expect(normalizeFieldType('Date')).toBe('date');
    expect(normalizeFieldType('Datetime')).toBe('datetime');
    expect(normalizeFieldType('Numeric')).toBe('numeric');
    expect(normalizeFieldType('Integer')).toBe('integer');
    expect(normalizeFieldType('Flipswitch')).toBe('flipswitch');
  });

  it('agrupa las variantes numéricas con decimales en "decimal"', () => {
    expect(normalizeFieldType('Hfloat')).toBe('decimal');
    expect(normalizeFieldType('CustomNumeric')).toBe('decimal');
    expect(normalizeFieldType('custom_numeric')).toBe('decimal');
    expect(normalizeFieldType('EnclosedNumeric')).toBe('decimal');
    expect(normalizeFieldType('enclosed_numeric')).toBe('decimal');
    expect(normalizeFieldType('EnclosedInteger')).toBe('decimal');
    expect(normalizeFieldType('enclosed_integer')).toBe('decimal');
  });

  it('resuelve el resto de los sinónimos', () => {
    expect(normalizeFieldType('Int')).toBe('integer');
    expect(normalizeFieldType('Simpleditor')).toBe('editor');
    expect(normalizeFieldType('Hora')).toBe('time');
    expect(normalizeFieldType('Char')).toBe('varchar');
    expect(normalizeFieldType('Character')).toBe('varchar');
    expect(normalizeFieldType('Field')).toBe('text');
    expect(normalizeFieldType('HtmlField')).toBe('html');
  });

  it('devuelve "" sin tipo', () => {
    expect(normalizeFieldType('')).toBe('');
    expect(normalizeFieldType(undefined)).toBe('');
    expect(normalizeFieldType(null)).toBe('');
  });
});
