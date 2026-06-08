import { describe, expect, it } from 'vitest';

import { isFieldEditable, visibleColumnNames } from './fieldVisibility.js';

/**
 * Recordatorio de semántica de isFieldEditable (igual que el método original):
 *   TRUE  = No editable (filtrar fuera)
 *   FALSE = Editable (mostrar)
 */
describe('isFieldEditable', () => {
  it('campo editable simple: editable=true, hidden falsy => editable (false)', () => {
    expect(isFieldEditable({ editable: true }, 'grid')).toBe(false);
  });

  it('campo no editable: editable falsy => no editable (true)', () => {
    expect(isFieldEditable({ editable: false }, 'grid')).toBe(true);
  });

  it('campo sin atributo editable (undefined) => no editable (true)', () => {
    expect(isFieldEditable({}, 'grid')).toBe(true);
  });

  it('editable=true + hidden falsy => editable (false) sin importar el tipo', () => {
    expect(isFieldEditable({ editable: true, hidden: false }, 'fichaing')).toBe(false);
  });

  it('hidden=true pero editable=true (no === false) => editable (true) por fallback', () => {
    // editable === false es false, por lo que la condición compuesta no se cumple
    // y cae en el return true final.
    expect(isFieldEditable({ editable: true, hidden: true, innerContainer: true, isSelect: false }, 'grid')).toBe(true);
  });

  it('caso compuesto que apaga editabilidad: tipo especial + innerContainer + no select', () => {
    // Para llegar a este bloque editable debe ser truthy (no entra al primer if)
    // y hidden truthy (no entra al segundo if). El original usa editable === false
    // dentro del bloque; al ser truthy arriba, isExplicitlyNotEditable es false,
    // por lo que NO se cumple la condición compuesta. Verificamos ese fallback.
    const field = { editable: 'x', hidden: true, innerContainer: true, isSelect: false };
    expect(isFieldEditable(field, 'grid')).toBe(true);
  });

  it('tipo fichaing con hidden+innerContainer => isSpecialType false => editable (true)', () => {
    const field = { editable: 'x', hidden: true, innerContainer: true, isSelect: false };
    expect(isFieldEditable(field, 'fichaing')).toBe(true);
  });

  it('tipo cabecera con hidden+innerContainer => isSpecialType false => editable (true)', () => {
    const field = { editable: 'x', hidden: true, innerContainer: true, isSelect: false };
    expect(isFieldEditable(field, 'cabecera')).toBe(true);
  });

  it('isSelect=true con hidden y tipo especial => no se cumple condición => editable (true)', () => {
    const field = { editable: 'x', hidden: true, innerContainer: true, isSelect: true };
    expect(isFieldEditable(field, 'grid')).toBe(true);
  });

  it('sin innerContainer con hidden y tipo especial => no se cumple condición => editable (true)', () => {
    const field = { editable: 'x', hidden: true, innerContainer: false, isSelect: false };
    expect(isFieldEditable(field, 'grid')).toBe(true);
  });
});

describe('visibleColumnNames', () => {
  it('devuelve los nombres de columnas visibles (no hidden, sin display:none)', () => {
    const columns = [
      { name: 'id', hidden: false, style: '' },
      { name: 'nombre', hidden: false, style: 'text-align:left;' }
    ];
    expect(visibleColumnNames(columns)).toEqual(['id', 'nombre']);
  });

  it('excluye columnas con hidden=true', () => {
    const columns = [
      { name: 'id', hidden: true, style: '' },
      { name: 'nombre', hidden: false, style: '' }
    ];
    expect(visibleColumnNames(columns)).toEqual(['nombre']);
  });

  it('excluye columnas con display:none; en el style', () => {
    const columns = [
      { name: 'id', hidden: false, style: 'display:none;' },
      { name: 'nombre', hidden: false, style: 'width:100px;' }
    ];
    expect(visibleColumnNames(columns)).toEqual(['nombre']);
  });

  it('excluye por ambas condiciones combinadas', () => {
    const columns = [
      { name: 'a', hidden: true, style: '' },
      { name: 'b', hidden: false, style: 'display:none;' },
      { name: 'c', hidden: false, style: '' }
    ];
    expect(visibleColumnNames(columns)).toEqual(['c']);
  });

  it('devuelve array vacío si no hay columnas', () => {
    expect(visibleColumnNames([])).toEqual([]);
  });

  it('hidden falsy (undefined) cuenta como visible', () => {
    const columns = [{ name: 'id', style: '' }];
    expect(visibleColumnNames(columns)).toEqual(['id']);
  });

  it('display:none; debe ser substring exacto (display:none sin ; no excluye)', () => {
    const columns = [{ name: 'id', hidden: false, style: 'display:none' }];
    expect(visibleColumnNames(columns)).toEqual(['id']);
  });
});
