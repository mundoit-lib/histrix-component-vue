import { describe, expect, it } from 'vitest';

import { buildPageParams, parsePageResponse } from './pagination.js';

describe('buildPageParams', () => {
  it('arma página, tamaño, total y el _limit legacy', () => {
    expect(buildPageParams({ page: 3, rowsPerPage: 20, sortBy: 'nombre', descending: true })).toEqual({
      _sortBy: 'nombre|desc',
      page: 3,
      page_size: 20,
      with_total: 1,
      _limit: '40,20'
    });
  });

  it('sin orden manda _sortBy vacío (orden por defecto del XML)', () => {
    expect(buildPageParams({ page: 1, rowsPerPage: 50 })._sortBy).toBe('');
  });

  it('rowsPerPage 0 ("Todos") no limita', () => {
    expect(buildPageParams({ page: 2, rowsPerPage: 0, sortBy: 'id' })).toEqual({ _sortBy: 'id|asc' });
  });

  it('acota el tamaño a maxLimit', () => {
    const p = buildPageParams({ page: 2, rowsPerPage: 500 }, { maxLimit: 200 });
    expect(p.page_size).toBe(200);
    expect(p._limit).toBe('200,200');
  });

  it('una página inválida vuelve a la 1', () => {
    expect(buildPageParams({ page: 0, rowsPerPage: 10 })._limit).toBe('0,10');
  });
});

describe('parsePageResponse', () => {
  const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

  it('DataTables con total real', () => {
    const r = parsePageResponse({ data: rows(20), recordsTotal: '137' }, { offset: 0, limit: 20 });
    expect(r.rows).toHaveLength(20);
    expect(r).toMatchObject({ total: 137, hasMore: true });
  });

  it('DataTables en la última página', () => {
    const r = parsePageResponse({ data: rows(17), recordsTotal: 137 }, { offset: 120, limit: 20 });
    expect(r).toMatchObject({ total: 137, hasMore: false });
  });

  it('recordsTotal = filas traídas con página llena → total desconocido', () => {
    const r = parsePageResponse({ data: rows(20), recordsTotal: 20 }, { offset: 40, limit: 20 });
    expect(r).toMatchObject({ total: null, hasMore: true });
  });

  it('recordsTotal = filas traídas con página incompleta → fin', () => {
    const r = parsePageResponse({ data: rows(5), recordsTotal: 5 }, { offset: 40, limit: 20 });
    expect(r).toMatchObject({ total: 45, hasMore: false });
  });

  it('envoltorio pagination con total', () => {
    const body = { data: rows(2), pagination: { limit: 2, offset: 0, count: 2, has_more: true, total: 9 } };
    expect(parsePageResponse(body)).toMatchObject({ total: 9, hasMore: true });
  });

  it('envoltorio pagination sin total', () => {
    const body = { data: rows(2), pagination: { limit: 2, offset: 4, count: 2, has_more: false } };
    expect(parsePageResponse(body)).toMatchObject({ total: null, hasMore: false });
  });

  it('respuesta sin data ni total', () => {
    expect(parsePageResponse({})).toEqual({ rows: [], total: 0, hasMore: false });
    expect(parsePageResponse(null, { limit: 10 })).toEqual({ rows: [], total: null, hasMore: false });
  });
});
