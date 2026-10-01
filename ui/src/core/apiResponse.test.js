import { describe, expect, it } from 'vitest';
import { normalizeData } from './apiResponse.js';

describe('normalizeData', () => {
  it('204 sin body → lista vacía', () => {
    expect(normalizeData({ status: 204, data: '' })).toEqual({ data: [] });
    expect(normalizeData({ status: 204 })).toEqual({ data: [] });
  });

  it('body vacío o null → lista vacía', () => {
    expect(normalizeData({ status: 200, data: '' })).toEqual({ data: [] });
    expect(normalizeData({ status: 200, data: null })).toEqual({ data: [] });
    expect(normalizeData(undefined)).toEqual({ data: [] });
  });

  it('envoltorio {data}', () => {
    expect(normalizeData({ status: 200, data: { data: [{ a: 1 }] } })).toEqual({ data: [{ a: 1 }] });
  });

  it('envoltorio {data, pagination}', () => {
    const pagination = { page: 1, rowsPerPage: 20, rowsNumber: 45 };
    expect(normalizeData({ status: 200, data: { data: [{ a: 1 }], pagination } })).toEqual({
      data: [{ a: 1 }],
      pagination
    });
  });

  it('envoltorio DataTables conserva recordsTotal/recordsFiltered/paging', () => {
    const body = { data: [{ a: 1 }], recordsTotal: '120', recordsFiltered: 3, paging: true };
    expect(normalizeData({ status: 200, data: body })).toEqual({
      data: [{ a: 1 }],
      recordsTotal: 120,
      recordsFiltered: 3,
      paging: true
    });
  });

  it('objeto sin data → data vacía, conserva el resto', () => {
    expect(normalizeData({ status: 200, data: { errors: false } })).toEqual({ errors: false, data: [] });
  });

  it('array suelto → {data: array}', () => {
    expect(normalizeData({ status: 200, data: [1, 2] })).toEqual({ data: [1, 2] });
  });

  it('no muta el body original', () => {
    const body = { recordsTotal: '5' };
    normalizeData({ status: 200, data: body });
    expect(body).toEqual({ recordsTotal: '5' });
  });
});
