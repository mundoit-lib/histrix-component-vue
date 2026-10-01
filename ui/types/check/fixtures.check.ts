/**
 * Validación local de los tipos contra las fixtures reales (no se publica):
 *   pnpm dlx -p typescript tsc -p ui/types/check
 */
import type { AppDataResponse, HistrixFieldSchema, SchemaResponse } from '../index';

import abmMiniData from '../../src/core/__fixtures__/abm-mini.data.json';
import abmMiniSchema from '../../src/core/__fixtures__/abm-mini.schema.json';
import abmData from '../../src/core/__fixtures__/abm.data.json';
import abmSchema from '../../src/core/__fixtures__/abm.schema.json';
import arbolSchema from '../../src/core/__fixtures__/arbol.schema.json';
import ayudaData from '../../src/core/__fixtures__/ayuda.data.json';
import ayudaSchema from '../../src/core/__fixtures__/ayuda.schema.json';
import calendarData from '../../src/core/__fixtures__/calendar.data.json';
import calendarSchema from '../../src/core/__fixtures__/calendar.schema.json';
import chartData from '../../src/core/__fixtures__/chart.data.json';
import chartSchema from '../../src/core/__fixtures__/chart.schema.json';
import consultaFiltrosData from '../../src/core/__fixtures__/consulta-filtros.data.json';
import consultaFiltrosSchema from '../../src/core/__fixtures__/consulta-filtros.schema.json';
import consultaPaginadaData from '../../src/core/__fixtures__/consulta-paginada.data.json';
import consultaPaginadaSchema from '../../src/core/__fixtures__/consulta-paginada.schema.json';
import crudHelperLinkData from '../../src/core/__fixtures__/crud-helper-link.data.json';
import crudHelperLinkSchema from '../../src/core/__fixtures__/crud-helper-link.schema.json';
import crudUpdateFieldsData from '../../src/core/__fixtures__/crud-update-fields.data.json';
import crudUpdateFieldsSchema from '../../src/core/__fixtures__/crud-update-fields.schema.json';
import crudData from '../../src/core/__fixtures__/crud.data.json';
import crudSchema from '../../src/core/__fixtures__/crud.schema.json';
import dashboardSchema from '../../src/core/__fixtures__/dashboard.schema.json';
import fichaPrefetchData from '../../src/core/__fixtures__/ficha-prefetch.data.json';
import fichaPrefetchSchema from '../../src/core/__fixtures__/ficha-prefetch.schema.json';
import fichaingFormulasSchema from '../../src/core/__fixtures__/fichaing-formulas.schema.json';
import fichaingIngSchema from '../../src/core/__fixtures__/fichaing-ing.schema.json';
import gridData from '../../src/core/__fixtures__/grid.data.json';
import gridSchema from '../../src/core/__fixtures__/grid.schema.json';
import ingData from '../../src/core/__fixtures__/ing.data.json';
import ingSchema from '../../src/core/__fixtures__/ing.schema.json';
import livegridData from '../../src/core/__fixtures__/livegrid.data.json';
import livegridSchema from '../../src/core/__fixtures__/livegrid.schema.json';
import treetableData from '../../src/core/__fixtures__/treetable.data.json';
import treetableSchema from '../../src/core/__fixtures__/treetable.schema.json';

export const schemas: SchemaResponse[] = [
  abmMiniSchema,
  abmSchema,
  arbolSchema,
  ayudaSchema,
  calendarSchema,
  chartSchema,
  consultaFiltrosSchema,
  consultaPaginadaSchema,
  crudHelperLinkSchema,
  crudSchema,
  crudUpdateFieldsSchema,
  dashboardSchema,
  fichaingFormulasSchema,
  fichaingIngSchema,
  fichaPrefetchSchema,
  gridSchema,
  ingSchema,
  livegridSchema,
  treetableSchema
];

export const data: AppDataResponse[] = [
  abmMiniData,
  abmData,
  ayudaData,
  calendarData,
  chartData,
  consultaFiltrosData,
  consultaPaginadaData,
  crudHelperLinkData,
  crudData,
  crudUpdateFieldsData,
  fichaPrefetchData,
  gridData,
  ingData,
  livegridData,
  treetableData
];

export const fields: HistrixFieldSchema[] = schemas.flatMap((s) => Object.values(s.schema.fields ?? {}));
