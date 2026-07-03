import { describe, expect, it } from 'vitest';
import { compactValues, omit, pick } from './values.js';

describe('compactValues', () => {
  it('elimina strings vacíos, null y undefined', () => {
    expect(compactValues({ a: '', b: null, c: undefined, d: 'x' })).toEqual({ d: 'x' });
  });

  it('conserva 0, "0" y false (son valores)', () => {
    expect(compactValues({ a: 0, b: '0', c: false, d: '' })).toEqual({ a: 0, b: '0', c: false });
  });

  it('conserva strings no vacíos y objetos', () => {
    const obj = { total: 'hola', nested: { x: 1 } };
    expect(compactValues(obj)).toEqual({ total: 'hola', nested: { x: 1 } });
  });

  it('replica el caso real del form (deja solo lo que tiene valor)', () => {
    const formValues = {
      titulo1: 'DATOS PRINCIPALES',
      id_oto: '',
      tipo_oto: '3',
      oto_numerador_format: '',
      regcuenta_resp_id: '',
      total_rqm_rao: '0',
      motivo_adicional: 'ok seba',
      id_req_obra: 1,
      cant_dias_habitado_oto: '30'
    };
    expect(compactValues(formValues)).toEqual({
      titulo1: 'DATOS PRINCIPALES',
      tipo_oto: '3',
      total_rqm_rao: '0',
      motivo_adicional: 'ok seba',
      id_req_obra: 1,
      cant_dias_habitado_oto: '30'
    });
  });

  it('devuelve {} para entradas inválidas', () => {
    expect(compactValues(null)).toEqual({});
    expect(compactValues(undefined)).toEqual({});
  });
});

describe('omit', () => {
  it('excluye la clave indicada', () => {
    expect(omit({ a: 1, b: 2, oto_numerador_format: '001' }, 'oto_numerador_format')).toEqual({ a: 1, b: 2 });
  });

  it('excluye varias claves', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, 'a', 'c')).toEqual({ b: 2 });
  });

  it('ignora claves vacías/nulas y las inexistentes', () => {
    expect(omit({ a: 1 }, '', null, undefined, 'noexiste')).toEqual({ a: 1 });
  });

  it('devuelve {} para entradas inválidas', () => {
    expect(omit(null, 'a')).toEqual({});
    expect(omit(undefined, 'a')).toEqual({});
  });
});

describe('pick', () => {
  it('conserva sólo las claves indicadas', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('ignora claves que no existen en el objeto', () => {
    expect(pick({ a: 1 }, ['a', 'noexiste'])).toEqual({ a: 1 });
  });

  it('conserva valores vacíos (el filtrado de vacíos lo hace compactValues)', () => {
    expect(pick({ tipo_oto: '', cant_dias_habitado_oto: '30' }, ['tipo_oto', 'cant_dias_habitado_oto'])).toEqual({
      tipo_oto: '',
      cant_dias_habitado_oto: '30'
    });
  });

  it('con lista vacía devuelve {}', () => {
    expect(pick({ a: 1 }, [])).toEqual({});
  });

  it('devuelve {} para entradas inválidas', () => {
    expect(pick(null, ['a'])).toEqual({});
    expect(pick({ a: 1 }, null)).toEqual({});
  });
});
