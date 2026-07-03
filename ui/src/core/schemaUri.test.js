import { describe, expect, it } from 'vitest';
import { joinDirXml, parseHelpDetail, parseSchemaUri } from './schemaUri.js';

describe('parseSchemaUri', () => {
  it('parsea la uri de una ayuda (solo xml + dir)', () => {
    expect(parseSchemaUri('ot_combinado_param_qry.xml&dir=/ayudas&')).toEqual({
      path: '/ayudas/ot_combinado_param_qry.xml',
      params: {}
    });
  });

  it('parsea un dataUri con parámetro __help', () => {
    expect(parseSchemaUri('pry_req_ots_oth_ing.xml&dir=/stock_obra/ing&__help=oto_numerador_format')).toEqual({
      path: '/stock_obra/ing/pry_req_ots_oth_ing.xml',
      params: { __help: 'oto_numerador_format' }
    });
  });

  it('parsea un innerContainer.uri con id de xml generado', () => {
    expect(parseSchemaUri('xml1264548887&dir=/stock_obra/ing&')).toEqual({
      path: '/stock_obra/ing/xml1264548887',
      params: {}
    });
  });

  it('acumula múltiples parámetros', () => {
    expect(parseSchemaUri('x.xml&dir=/d&a=1&b=2')).toEqual({
      path: '/d/x.xml',
      params: { a: '1', b: '2' }
    });
  });

  it('decodifica valores url-encoded', () => {
    expect(parseSchemaUri('x.xml&dir=/d&q=a%20b')).toEqual({
      path: '/d/x.xml',
      params: { q: 'a b' }
    });
  });

  it('sin dir devuelve solo el xml como path', () => {
    expect(parseSchemaUri('x.xml&a=1')).toEqual({ path: 'x.xml', params: { a: '1' } });
  });

  it('devuelve vacío para entradas inválidas', () => {
    expect(parseSchemaUri('')).toEqual({ path: '', params: {} });
    expect(parseSchemaUri(null)).toEqual({ path: '', params: {} });
    expect(parseSchemaUri(undefined)).toEqual({ path: '', params: {} });
  });
});

describe('joinDirXml', () => {
  it('une dir + xml', () => {
    expect(joinDirXml('/stock_obra/ing', 'pry_req_ots_oth_ing.xml')).toBe('/stock_obra/ing/pry_req_ots_oth_ing.xml');
    expect(joinDirXml('/ayudas', 'ot_combinado_param_qry.xml')).toBe('/ayudas/ot_combinado_param_qry.xml');
  });

  it('sin dir devuelve solo el xml', () => {
    expect(joinDirXml('', 'x.xml')).toBe('x.xml');
    expect(joinDirXml(undefined, 'x.xml')).toBe('x.xml');
  });

  it('sin xml devuelve ""', () => {
    expect(joinDirXml('/d', '')).toBe('');
    expect(joinDirXml('/d', undefined)).toBe('');
  });
});

describe('parseHelpDetail', () => {
  it('parsea el querystring a objeto plano, decodificando + y %XX', () => {
    const detail =
      '&oto_numerador_format=OTMOA-00000001&id_oto=1&cod_enlace=A039118&nombre_cliente=RENOVA+S.A&regcuenta_resp_id=2359&cuenta_stkdeposito_id=24';
    expect(parseHelpDetail(detail)).toEqual({
      oto_numerador_format: 'OTMOA-00000001',
      id_oto: '1',
      cod_enlace: 'A039118',
      nombre_cliente: 'RENOVA S.A',
      regcuenta_resp_id: '2359',
      cuenta_stkdeposito_id: '24'
    });
  });

  it('devuelve {} para entradas inválidas', () => {
    expect(parseHelpDetail('')).toEqual({});
    expect(parseHelpDetail(null)).toEqual({});
    expect(parseHelpDetail(undefined)).toEqual({});
  });
});
