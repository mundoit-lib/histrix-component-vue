import { describe, expect, it } from 'vitest';
import { buildLinkParameters, dirname, resolveHelperLinkPath } from './links.js';

describe('dirname', () => {
  it('devuelve el directorio con barra final', () => {
    expect(dirname('stock_obra/ing/tablero.xml')).toBe('stock_obra/ing/');
    expect(dirname('/stock_obra/ing/tablero.xml')).toBe('/stock_obra/ing/');
  });

  it('devuelve "" cuando no hay directorio', () => {
    expect(dirname('tablero.xml')).toBe('');
    expect(dirname('')).toBe('');
    expect(dirname(null)).toBe('');
    expect(dirname(undefined)).toBe('');
  });
});

describe('resolveHelperLinkPath', () => {
  it('usa dir cuando el link lo trae', () => {
    const link = { xml: 'pry_req_ing.xml', dir: '/stock_obra/ing' };
    expect(resolveHelperLinkPath(link, 'stock_obra/ing/tablero.xml')).toBe('/stock_obra/ing/pry_req_ing.xml');
  });

  it('resuelve relativo al XML actual cuando falta dir', () => {
    const link = { xml: 'pry_req_ots_oth_ing.xml' };
    expect(resolveHelperLinkPath(link, 'stock_obra/ing/tablero_req_obra.xml')).toBe(
      '/stock_obra/ing/pry_req_ots_oth_ing.xml'
    );
  });

  it('trata dir vacío como faltante', () => {
    const link = { xml: 'x.xml', dir: '' };
    expect(resolveHelperLinkPath(link, 'a/b/c.xml')).toBe('/a/b/x.xml');
  });

  it('normaliza barras duplicadas', () => {
    const link = { xml: 'x.xml', dir: 'a/b/' };
    expect(resolveHelperLinkPath(link, '')).toBe('a/b/x.xml');
  });

  it('devuelve "" si el link no es válido', () => {
    expect(resolveHelperLinkPath(null, 'a/b.xml')).toBe('');
    expect(resolveHelperLinkPath({}, 'a/b.xml')).toBe('');
    expect(resolveHelperLinkPath({ dir: '/x' }, 'a/b.xml')).toBe('');
  });
});

describe('buildLinkParameters', () => {
  it('convierte parámetros con operador = en un objeto de query', () => {
    expect(buildLinkParameters([{ source: '3', target: 'tipo_oto', operator: '=' }])).toEqual({ tipo_oto: '3' });
  });

  it('soporta múltiples parámetros', () => {
    const params = [
      { source: '2', target: 'tipo_oto', operator: '=' },
      { source: 'X', target: 'cod', operator: '=' }
    ];
    expect(buildLinkParameters(params)).toEqual({ tipo_oto: '2', cod: 'X' });
  });

  it('trata la ausencia de operador como asignación', () => {
    expect(buildLinkParameters([{ source: '5', target: 'campo' }])).toEqual({ campo: '5' });
  });

  it('ignora operadores distintos de =', () => {
    expect(buildLinkParameters([{ source: '5', target: 'campo', operator: 'like' }])).toEqual({});
  });

  it('ignora parámetros sin target y entradas no-array', () => {
    expect(buildLinkParameters([{ source: '5', operator: '=' }])).toEqual({});
    expect(buildLinkParameters([])).toEqual({});
    expect(buildLinkParameters(null)).toEqual({});
    expect(buildLinkParameters(undefined)).toEqual({});
  });
});
