import { describe, expect, it } from 'vitest';

import {
  cellValue,
  columnTotals,
  headerCheckState,
  isChecked,
  isSumColumn,
  nextOrden,
  nextRowId,
  removeRow,
  renumberOrden,
  rowIndexById,
  setCellValue,
  setColumnChecked,
  upsertRow
} from './gridRows.js';

describe('cellValue / setCellValue', () => {
  it('lee celdas planas y objetos de la API', () => {
    expect(cellValue(3)).toBe(3);
    expect(cellValue({ value: 4, _: 'x' })).toBe(4);
    expect(cellValue({ _: 'x' })).toBe('x');
    expect(cellValue(null)).toBe(null);
  });

  it('escribe conservando la forma de la celda', () => {
    const row = { a: 1, b: { value: 2, style: 'x' } };
    setCellValue(row, 'a', 10);
    setCellValue(row, 'b', 20);
    expect(row).toEqual({ a: 10, b: { value: 20, style: 'x' } });
  });
});

describe('nextOrden / nextRowId', () => {
  it('nextOrden usa el máximo + 1, con celdas planas u objeto', () => {
    expect(nextOrden([])).toBe(1);
    expect(nextOrden([{ _ORDEN: 1 }, { _ORDEN: { value: '5' } }, { _ORDEN: 'x' }])).toBe(6);
  });

  it('nextRowId no repite un _id después de un borrado', () => {
    expect(nextRowId([])).toBe(0);
    expect(nextRowId([{ _id: 0 }, { _id: 2 }])).toBe(3);
  });
});

describe('upsertRow / removeRow / renumberOrden', () => {
  const rows = () => [
    { _id: 0, _ORDEN: 1, art: 'A' },
    { _id: 1, _ORDEN: 2, art: 'B' },
    { _id: 2, _ORDEN: 3, art: 'C' }
  ];

  it('reemplaza el renglón de igual _id', () => {
    const data = rows();
    const result = upsertRow(data, { _id: 1, _ORDEN: 2, art: 'B2' });
    expect(result).toEqual({ index: 1, isNew: false });
    expect(data.map((r) => r.art)).toEqual(['A', 'B2', 'C']);
  });

  it('agrega al final un _id nuevo', () => {
    const data = rows();
    expect(upsertRow(data, { _id: 7, art: 'D' })).toEqual({ index: 3, isNew: true });
    expect(data).toHaveLength(4);
  });

  it('borra y renumera _ORDEN', () => {
    const data = rows();
    expect(removeRow(data, 0)).toBe(true);
    expect(data.map((r) => [r.art, r._ORDEN])).toEqual([
      ['B', 1],
      ['C', 2]
    ]);
    expect(removeRow(data, 99)).toBe(false);
  });

  it('renumera sólo las filas que tienen _ORDEN y respeta celdas objeto', () => {
    const data = [{ _ORDEN: { value: 9 } }, { art: 'sin orden' }, { _ORDEN: 4 }];
    renumberOrden(data);
    expect(data).toEqual([{ _ORDEN: { value: 1 } }, { art: 'sin orden' }, { _ORDEN: 2 }]);
  });

  it('rowIndexById ignora _id indefinido', () => {
    expect(rowIndexById(rows(), undefined)).toBe(-1);
    expect(rowIndexById(rows(), 2)).toBe(2);
  });

  it('caso de aceptación: 3 renglones, modificar el 2º, borrar el 1º', () => {
    const data = [];
    for (const art of ['A', 'B', 'C']) {
      upsertRow(data, { _id: nextRowId(data), _ORDEN: nextOrden(data), art });
    }
    upsertRow(data, { ...data[1], art: 'B modificado' });
    removeRow(data, data[0]._id);
    expect(data.map((r) => [r._ORDEN, r.art])).toEqual([
      [1, 'B modificado'],
      [2, 'C']
    ]);
  });
});

describe('columnTotals', () => {
  const columns = [{ name: 'cant', sum: 'true' }, { name: 'importe', sum: true }, { name: 'precio' }, { name: 'art' }];
  const data = [
    { cant: '2', importe: { value: '10.5' }, precio: 5, art: 'A' },
    { cant: 3, importe: { _: '4.5' }, precio: 'x', art: 'B' }
  ];

  it('suma las columnas sum (celdas planas u objeto, no numéricos = 0)', () => {
    expect(columnTotals(data, columns)).toEqual({ cant: 5, importe: 15 });
  });

  it('agrega las columnas origen de computedTotals', () => {
    expect(columnTotals(data, columns, { total_cab: 'precio' })).toEqual({ cant: 5, importe: 15, precio: 5 });
  });

  it('sin filas, totales en 0', () => {
    expect(columnTotals([], columns)).toEqual({ cant: 0, importe: 0 });
  });

  it('isSumColumn acepta booleano o string', () => {
    expect(isSumColumn({ sum: 'true' })).toBe(true);
    expect(isSumColumn({ sum: 'false' })).toBe(false);
    expect(isSumColumn(undefined)).toBe(false);
  });
});

describe('checkbox de cabecera', () => {
  it('isChecked sigue el criterio de HistrixField', () => {
    expect([true, '1', 'S', 1].map(isChecked)).toEqual([true, true, true, true]);
    expect([false, '0', '', 0, null, undefined].map(isChecked)).toEqual([false, false, false, false, false, false]);
  });

  it('headerCheckState: todas, ninguna o mezcla', () => {
    expect(headerCheckState([], 'ok')).toBe(false);
    expect(headerCheckState([{ ok: '1' }, { ok: { value: true } }], 'ok')).toBe(true);
    expect(headerCheckState([{ ok: '0' }, { ok: '' }], 'ok')).toBe(false);
    expect(headerCheckState([{ ok: '1' }, { ok: '0' }], 'ok')).toBe(null);
  });

  it('setColumnChecked marca todo y devuelve sólo las filas que cambiaron', () => {
    const data = [{ ok: '1' }, { ok: { value: '0' } }, { ok: false }];
    const changed = setColumnChecked(data, 'ok', true);
    expect(changed).toEqual([data[1], data[2]]);
    expect(headerCheckState(data, 'ok')).toBe(true);
    expect(data[1]).toEqual({ ok: { value: true } });
  });
});
