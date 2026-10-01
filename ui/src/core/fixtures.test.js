/**
 * El core contra schemas y datos reales (anonimizados) del backend: cada módulo
 * corre sobre cada fixture, no tiene que tirar, y lo que resuelve queda en un
 * snapshot por fixture. Si un kind cambia, el diff del snapshot lo muestra; si
 * un kind es raro (p. ej. `q-input` donde debería haber un decimal), se anota
 * como insumo del contrato, no se "arregla" el snapshot.
 */
import { describe, expect, it } from 'vitest';

import { fixtures } from './__fixtures__/index.js';
import { computeFormulaFlags, parseDataFormulas } from './dataFormulas.js';
import { hasOptions, renderHelper, resolveFieldKind } from './fieldType.js';
import { isFieldEditable, visibleColumnNames } from './fieldVisibility.js';
import { extractKeys, keyFieldNames } from './keys.js';
import { resolveHelperLinkPath } from './links.js';
import { mapDictOptions } from './options.js';
import { joinDirXml, parseSchemaUri } from './schemaUri.js';
import { resolveScreenKind } from './screenType.js';

/** Columnas como las arma `HistrixApp.buildColumns` (la `_id` oculta + una por campo). */
const buildColumns = (fields) => [
  { name: '_id', hidden: true, style: null },
  ...Object.values(fields).map((f) => ({ name: f.name, hidden: f.hidden_column, style: f.column_style }))
];

/** Los XML embebidos tienen un id que el backend regenera en cada request (`xml1667359894`). */
const stableXml = (path) => path.replace(/\bxml\d+\b/g, 'xml<embebido>');

const rowsOf = (data) => (Array.isArray(data?.data) ? data.data : []);

/** Lo que el core resuelve para un campo, sin los valores por defecto (para que el snapshot se lea). */
function fieldSummary(field, schema) {
  const out = { histrix_type: field.histrix_type, kind: resolveFieldKind(field) };
  if (hasOptions(field)) out.hasOptions = true;
  if (renderHelper(field)) out.renderHelper = true;
  if (!isFieldEditable(field, schema.type)) out.editable = true;
  const options = field.options_sorted ?? field.options;
  if (options && typeof options === 'object') {
    const { data, flat } = mapDictOptions(options, false);
    out.options = data.length;
    if (flat) out.optionsFlat = true;
  }
  if (field.innerContainer?.uri) {
    const { path, params } = parseSchemaUri(field.innerContainer.uri);
    out.innerContainer = { path: stableXml(path), params };
  }
  if (field.helpContainer) out.helpContainer = joinDirXml(field.helpContainer.dir, field.helpContainer.xml);
  if (field.helpers?.link) out.link = resolveHelperLinkPath(field.helpers.link, schema.path || '');
  const formulas = parseDataFormulas(field['data-formulas']);
  if (formulas.length) out.formulas = formulas.map((f) => f.targetField);
  if (Array.isArray(field.update_fields) && field.update_fields.length) out.update_fields = field.update_fields.length;
  return out;
}

describe.each(fixtures)('fixture $name', ({ schemaResponse, schema, data }) => {
  const fields = schema.fields || {};

  it('trae el envoltorio { resources, schema }', () => {
    expect(schemaResponse).toHaveProperty('resources');
    expect(schema).toHaveProperty('type');
  });

  it('resuelve los kinds sin tirar (snapshot)', () => {
    const summary = {
      type: schema.type,
      screenKind: resolveScreenKind(schema.type),
      keys: keyFieldNames(fields),
      visibleColumns: visibleColumnNames(buildColumns(fields)),
      fields: Object.fromEntries(Object.entries(fields).map(([name, f]) => [name, fieldSummary(f, schema)]))
    };
    expect(summary).toMatchSnapshot();
  });

  it('options_sorted: las claves con espacio quedan sin espacio', () => {
    for (const field of Object.values(fields)) {
      if (!field.options_sorted) continue;
      for (const { value } of mapDictOptions(field.options_sorted, false).data) {
        if (typeof value === 'string') expect(value).toBe(value.trim());
      }
    }
  });

  it('data-formulas: evalúa contra la primera fila sin tirar', () => {
    const row = rowsOf(data)[0] || schema.values || {};
    for (const field of Object.values(fields)) {
      const formulas = parseDataFormulas(field['data-formulas']);
      expect(() => computeFormulaFlags(formulas, (name) => row[name])).not.toThrow();
    }
  });

  it('extrae las claves de cada fila', () => {
    const keys = keyFieldNames(fields);
    for (const row of rowsOf(data)) {
      expect(Object.keys(extractKeys(row, fields))).toEqual(keys);
    }
  });
});

it('hay al menos 15 fixtures', () => {
  expect(fixtures.length).toBeGreaterThanOrEqual(15);
});
