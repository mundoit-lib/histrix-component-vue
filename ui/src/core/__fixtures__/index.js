/**
 * Fixtures reales (anonimizadas) de schema y datos de Histrix, capturadas con
 * `ui/dev/scripts/capture-fixtures.mjs`. Sólo para tests: lee los JSON del disco.
 *
 * Cada fixture es `{ name, schemaResponse, schema, data }`:
 *   - `schemaResponse`: la respuesta cruda de `GET /schema/{xml}` (`{ resources, schema }`).
 *   - `schema`: `schemaResponse.schema`.
 *   - `data`: la respuesta de `GET /app/{xml}?_limit=5`, o `{ status }` si el
 *     backend respondió con error (p. ej. un fichaing sin parámetros).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

/** @type {Array<{ name: string, schemaResponse: object, schema: object, data: object }>} */
export const fixtures = readdirSync(dir)
  .filter((file) => file.endsWith('.schema.json'))
  .sort()
  .map((file) => {
    const name = file.replace(/\.schema\.json$/, '');
    const schemaResponse = read(file);
    return { name, schemaResponse, schema: schemaResponse.schema, data: read(`${name}.data.json`) };
  });
