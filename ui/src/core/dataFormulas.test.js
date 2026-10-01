import { describe, expect, it } from 'vitest';
import { computeFormulaFlags, parseDataFormulas } from './dataFormulas.js';

const ENCODED =
  '[{&quot;formula&quot;:&quot;tipo_requerimiento_id_rao   ==   2&quot;,&quot;targetField&quot;:&quot;__REQUIRED&quot;,&quot;ajaxupdate&quot;:&quot;false&quot;}]';

describe('parseDataFormulas', () => {
  it('parsea el string JSON HTML-encodeado', () => {
    expect(parseDataFormulas(ENCODED)).toEqual([
      { formula: 'tipo_requerimiento_id_rao   ==   2', targetField: '__REQUIRED', ajaxupdate: 'false' }
    ]);
  });

  it('acepta un array ya parseado', () => {
    const arr = [{ formula: 'a == 1', targetField: '__VISIBLE' }];
    expect(parseDataFormulas(arr)).toBe(arr);
  });

  it('devuelve [] para entradas vacías o inválidas', () => {
    expect(parseDataFormulas('')).toEqual([]);
    expect(parseDataFormulas(null)).toEqual([]);
    expect(parseDataFormulas(undefined)).toEqual([]);
    expect(parseDataFormulas('no es json')).toEqual([]);
    expect(parseDataFormulas('{"a":1}')).toEqual([]); // objeto, no array
  });
});

describe('computeFormulaFlags', () => {
  const ctx = (obj) => (k) => obj[k];

  it('__REQUIRED según la fórmula', () => {
    const rules = [{ formula: 'tipo_requerimiento_id_rao == 2', targetField: '__REQUIRED' }];
    expect(computeFormulaFlags(rules, ctx({ tipo_requerimiento_id_rao: '2' }))).toEqual({ required: true });
    expect(computeFormulaFlags(rules, ctx({ tipo_requerimiento_id_rao: '3' }))).toEqual({ required: false });
  });

  it('__VISIBLE y __ENABLED', () => {
    expect(computeFormulaFlags([{ formula: 'a == 1', targetField: '__VISIBLE' }], ctx({ a: 1 }))).toEqual({
      visible: true
    });
    expect(computeFormulaFlags([{ formula: 'a == 1', targetField: '__ENABLED' }], ctx({ a: 0 }))).toEqual({
      enabled: false
    });
  });

  it('sin reglas devuelve {} (el consumidor usa sus defaults)', () => {
    expect(computeFormulaFlags([], ctx({}))).toEqual({});
    expect(computeFormulaFlags(null, ctx({}))).toEqual({});
  });

  it('combina varias: required OR, visible/enabled AND', () => {
    const req = [
      { formula: 'a == 1', targetField: '__REQUIRED' },
      { formula: 'b == 1', targetField: '__REQUIRED' }
    ];
    expect(computeFormulaFlags(req, ctx({ a: 0, b: 1 }))).toEqual({ required: true });
    const vis = [
      { formula: 'a == 1', targetField: '__VISIBLE' },
      { formula: 'b == 1', targetField: '__VISIBLE' }
    ];
    expect(computeFormulaFlags(vis, ctx({ a: 1, b: 0 }))).toEqual({ visible: false });
  });

  it('ignora reglas sin targetField o sin formula', () => {
    expect(computeFormulaFlags([{ formula: 'a == 1' }, { targetField: '__REQUIRED' }], ctx({ a: 1 }))).toEqual({});
  });
});
