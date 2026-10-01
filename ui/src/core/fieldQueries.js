/**
 * fieldQueries.js — query de cada campo con contenedor (combo/ayuda) a partir
 * de los valores actuales de un registro.
 *
 * Es la misma lógica que `HistrixForm.fieldQuerys` (stateless: el combo hijo
 * re-consulta su innerContainer con el valor del padre), extraída para que la
 * grilla la use por fila:
 *  - `innerContainer.schema.conditions` con operador `=` → valor fijo.
 *  - `innerContainer.relationship` → valor del campo local de la fila.
 *  - `update_fields` del padre ("histrix actualiza") → el valor del padre va
 *    como `targetField` en la query del campo dependiente.
 *  - entradas objeto de la query externa se copian tal cual.
 */

const plain = (value) => (value && typeof value === 'object' && 'value' in value ? value.value : value);

/**
 * @param {Object} fields - schema.fields.
 * @param {Object} values - valores planos del registro ({campo: valor}).
 * @param {Object} [externalQuery] - query que recibe el componente.
 * @returns {Object} {campo: {param: valor}}
 */
export function buildFieldQueries(fields, values, externalQuery = {}) {
  const queries = {};
  const row = values || {};

  for (const [name, field] of Object.entries(fields || {})) {
    if (!field?.innerContainer || field.options) {
      continue;
    }
    const { innerContainer } = field;
    const rel = {};
    let touched = false;
    if (innerContainer.schema?.conditions) {
      for (const [target, conditions] of Object.entries(innerContainer.schema.conditions)) {
        for (const condition of Object.values(conditions || {})) {
          if (condition?.operador === '=') {
            rel[target] = condition.valor;
          }
        }
      }
      touched = true;
    }
    if (innerContainer.relationship) {
      for (const [target, source] of Object.entries(innerContainer.relationship)) {
        rel[target] = row[source?.valor];
      }
      touched = true;
    }
    if (touched) {
      queries[field.name || name] = rel;
    }
  }

  for (const [name, field] of Object.entries(fields || {})) {
    if (!Array.isArray(field?.update_fields)) {
      continue;
    }
    const value = plain(row[field.name || name]);
    for (const relation of field.update_fields) {
      if (relation.parentField) {
        const parent = queries[relation.parentField] || {};
        parent[relation.field] = { ...(parent[relation.field] || {}), [relation.targetField]: value };
        queries[relation.parentField] = parent;
      } else {
        queries[relation.field] = { ...(queries[relation.field] || {}), [relation.targetField]: value };
      }
    }
  }

  for (const [key, query] of Object.entries(externalQuery || {})) {
    if (query && typeof query === 'object') {
      queries[key] = query;
    }
  }

  return queries;
}
