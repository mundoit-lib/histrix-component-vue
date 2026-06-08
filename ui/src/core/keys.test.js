import { describe, expect, it } from 'vitest';

import { extractKeys } from './keys.js';

/** Helper: arma un schema.fields a partir de los nombres de campos clave. */
const schema = (keyNames, extraNonKey = []) => {
  const fields = {};
  for (const name of keyNames) {
    fields[name] = { esClave: 'true' };
  }
  for (const name of extraNonKey) {
    fields[name] = { esClave: 'false' };
  }
  return fields;
};

describe('extractKeys', () => {
  it('extrae una clave simple', () => {
    const fields = schema(['id'], ['nombre']);
    const item = { id: 42, nombre: 'foo' };
    expect(extractKeys(item, fields)).toEqual({ id: 42 });
  });

  it('extrae una clave compuesta (2 campos esClave)', () => {
    const fields = schema(['empresa', 'numero'], ['descripcion']);
    const item = { empresa: 1, numero: 100, descripcion: 'bar' };
    expect(extractKeys(item, fields)).toEqual({ empresa: 1, numero: 100 });
  });

  it('devuelve {} cuando el schema no tiene claves', () => {
    const fields = schema([], ['nombre', 'descripcion']);
    const item = { nombre: 'foo', descripcion: 'bar' };
    expect(extractKeys(item, fields)).toEqual({});
  });

  it('devuelve undefined cuando el campo clave está ausente en el item', () => {
    const fields = schema(['id']);
    const item = {};
    const result = extractKeys(item, fields);
    expect(result).toHaveProperty('id', undefined);
    expect(result).toEqual({ id: undefined });
  });
});
