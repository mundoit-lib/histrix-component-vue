import { describe, expect, it } from 'vitest';

import { buildFieldQueries } from './fieldQueries.js';

describe('buildFieldQueries', () => {
  it('condiciones = del innerContainer y relaciones con la fila', () => {
    const fields = {
      localidad: {
        name: 'localidad',
        innerContainer: {
          schema: { conditions: { activo: [{ operador: '=', valor: '1' }], id: [{ operador: '>', valor: '0' }] } },
          relationship: { provincia: { valor: 'prov' } }
        }
      }
    };
    expect(buildFieldQueries(fields, { prov: 'BA' })).toEqual({ localidad: { activo: '1', provincia: 'BA' } });
  });

  it('ignora campos con options o sin contenedor', () => {
    const fields = {
      a: { name: 'a', options: [{ value: 1 }], innerContainer: { relationship: { x: { valor: 'b' } } } },
      b: { name: 'b' }
    };
    expect(buildFieldQueries(fields, { b: 1 })).toEqual({});
  });

  it('update_fields: el valor del padre va como targetField del hijo', () => {
    const fields = {
      provincia: { name: 'provincia', update_fields: [{ field: 'localidad', targetField: 'id_provincia' }] },
      localidad: {
        name: 'localidad',
        innerContainer: { schema: { conditions: { activo: [{ operador: '=', valor: '1' }] } } }
      }
    };
    expect(buildFieldQueries(fields, { provincia: 'BA' })).toEqual({
      localidad: { activo: '1', id_provincia: 'BA' }
    });
  });

  it('update_fields sin contenedor previo crea la query', () => {
    const fields = { a: { name: 'a', update_fields: [{ field: 'b', targetField: 't' }] } };
    expect(buildFieldQueries(fields, { a: { value: 7 } })).toEqual({ b: { t: 7 } });
  });

  it('update_fields con parentField anida la query del campo interno', () => {
    const fields = { a: { name: 'a', update_fields: [{ parentField: 'grid', field: 'b', targetField: 't' }] } };
    expect(buildFieldQueries(fields, { a: 3 })).toEqual({ grid: { b: { t: 3 } } });
  });

  it('copia las entradas objeto de la query externa', () => {
    expect(buildFieldQueries({}, {}, { grid: { x: 1 }, plano: 'no' })).toEqual({ grid: { x: 1 } });
  });
});
