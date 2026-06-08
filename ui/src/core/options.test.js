import { describe, expect, it } from 'vitest';

import { mapArrayOptions, mapDictOptions, mapRemoteOptions } from './options.js';

describe('mapDictOptions (diccionario { key: label })', () => {
  it('mapea { key: label } a { value, label, description, data }', () => {
    const { data, flat } = mapDictOptions({ a: 'Alfa', b: 'Beta' }, false);
    expect(flat).toBe(false);
    expect(data).toEqual([
      { value: 'a', label: 'Alfa', description: 'Alfa', data: ['a', 'Alfa'] },
      { value: 'b', label: 'Beta', description: 'Beta', data: ['b', 'Beta'] }
    ]);
  });

  it('coerce a Number las keys numéricas (string del backend)', () => {
    // JS itera las keys numéricas de un objeto en orden numérico ascendente,
    // por eso 2 viene antes que 10 (igual que en el componente original).
    const { data } = mapDictOptions({ 10: 'Diez', 2: 'Dos' }, false);
    expect(data[0].value).toBe(2);
    expect(data[1].value).toBe(10);
    expect(typeof data[0].value).toBe('number');
  });

  it('hace trim de keys con espacio antepuesto (options_sorted, docs/07 §8.1)', () => {
    // Las keys de options_sorted llegan con un espacio para forzar el orden.
    const { data } = mapDictOptions({ ' 3': 'Tres', ' 1': 'Uno' }, false);
    // El trim deja '3' y '1', que luego se coercionan a Number.
    expect(data[0].value).toBe(3);
    expect(data[1].value).toBe(1);
  });

  it('mantiene el orden de inserción del diccionario (no reordena)', () => {
    // El orden lo aplica this.orderData en el componente, no la función pura.
    const { data } = mapDictOptions({ ' 2': 'Banana', ' 1': 'Ananá' }, false);
    expect(data.map((d) => d.label)).toEqual(['Banana', 'Ananá']);
  });

  it('usa el primer valor cuando la label es un objeto', () => {
    const { data } = mapDictOptions({ x: { nombre: 'Equis', otro: 'z' } }, false);
    expect(data[0].label).toBe('Equis');
    expect(data[0].description).toBe('Equis');
  });

  it('con helperPath usa data = option[1] (sin description)', () => {
    const { data } = mapDictOptions({ a: 'Alfa' }, true);
    expect(data[0]).toEqual({ value: 'a', label: 'Alfa', data: 'Alfa' });
    expect(data[0]).not.toHaveProperty('description');
  });

  it('con helperPath, `option[1] ?? {}` conserva el string vacío (?? sólo atrapa null/undefined)', () => {
    // `option[1] ?? {}`: '' NO es nullish, así que se conserva tal cual.
    const { data } = mapDictOptions({ a: '' }, true);
    expect(data[0].data).toBe('');
  });

  it('detecta flat cuando la label arranca con fecha dd/mm/yyyy', () => {
    const { flat } = mapDictOptions({ a: '01/02/2024 - Pago' }, false);
    expect(flat).toBe(true);
  });

  it('caso vacío: {} devuelve data vacío y flat false', () => {
    expect(mapDictOptions({}, false)).toEqual({ data: [], flat: false });
  });

  it('caso vacío: undefined devuelve data vacío y flat false', () => {
    expect(mapDictOptions(undefined, false)).toEqual({ data: [], flat: false });
  });
});

describe('mapArrayOptions (array full_options)', () => {
  it('mapea elementos string usando String(option._id) como value', () => {
    // option._id es undefined para strings → String(undefined) === 'undefined'.
    const { data, flat } = mapArrayOptions(['Alfa', 'Beta'], false);
    expect(flat).toBe(false);
    expect(data).toEqual([
      { value: 'undefined', label: 'Alfa', description: 'Alfa', data: 'Alfa' },
      { value: 'undefined', label: 'Beta', description: 'Beta', data: 'Beta' }
    ]);
  });

  it('usa _id del objeto como value y su primer valor (string) como label', () => {
    // El primer key del objeto es la label; debe ser string para el chequeo
    // de fecha (.includes), igual que en el componente original.
    const { data } = mapArrayOptions([{ nombre: 'Siete', _id: 7 }], false);
    expect(data[0].value).toBe('7');
    expect(data[0].label).toBe('Siete');
    expect(data[0].data).toEqual({ nombre: 'Siete', _id: 7 });
  });

  it('con helperPath omite description y data', () => {
    const { data } = mapArrayOptions([{ nombre: 'Uno', _id: 1 }], true);
    expect(data[0]).toEqual({ value: '1', label: 'Uno' });
  });

  it('detecta flat cuando la label arranca con fecha dd/mm/yyyy', () => {
    const { flat } = mapArrayOptions(['01/02/2024 - Pago'], false);
    expect(flat).toBe(true);
  });

  it('caso vacío: [] devuelve data vacío y flat false', () => {
    expect(mapArrayOptions([], false)).toEqual({ data: [], flat: false });
  });

  it('caso vacío: undefined devuelve data vacío y flat false', () => {
    expect(mapArrayOptions(undefined, false)).toEqual({ data: [], flat: false });
  });
});

describe('mapRemoteOptions (respuesta remota: array de objetos)', () => {
  it('toma value/label por posición (1er y 2do campo)', () => {
    const remote = [{ id: 5, nombre: 'Cinco', extra: 'x' }];
    const { data, flat } = mapRemoteOptions(remote, false);
    expect(flat).toBe(false);
    expect(data).toEqual([
      {
        value: 5,
        label: 'Cinco',
        description: 'Cinco',
        data: { id: 5, nombre: 'Cinco', extra: 'x' }
      }
    ]);
  });

  it('prefiere las claves value/label cuando existen', () => {
    const remote = [{ otro: 'a', value: 99, label: 'Noventa y nueve' }];
    const { data } = mapRemoteOptions(remote, false);
    expect(data[0].value).toBe(99);
    expect(data[0].label).toBe('Noventa y nueve');
  });

  it('descarta los items sin label', () => {
    const remote = [
      { id: 1, nombre: '' },
      { id: 2, nombre: 'Dos' }
    ];
    const { data } = mapRemoteOptions(remote, false);
    expect(data).toHaveLength(1);
    expect(data[0].label).toBe('Dos');
  });

  it('con helperPath omite description y data', () => {
    const remote = [{ id: 1, nombre: 'Uno' }];
    const { data } = mapRemoteOptions(remote, true);
    expect(data[0]).toEqual({ value: 1, label: 'Uno' });
  });

  it('detecta flat cuando la label arranca con fecha dd/mm/yyyy', () => {
    const remote = [{ id: 1, nombre: '01/02/2024 - Pago' }];
    const { flat } = mapRemoteOptions(remote, false);
    expect(flat).toBe(true);
  });

  it('caso vacío: [] devuelve data vacío y flat false', () => {
    expect(mapRemoteOptions([], false)).toEqual({ data: [], flat: false });
  });

  it('caso vacío: undefined devuelve data vacío y flat false', () => {
    expect(mapRemoteOptions(undefined, false)).toEqual({ data: [], flat: false });
  });
});
