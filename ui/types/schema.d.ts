/**
 * Contrato backend → cliente de Histrix: lo que devuelven `GET /schema/{xml}` y
 * `GET /app/{xml}`. Basado en `Container::getSchema` y `Field::getSchema` del
 * backend y contrastado con las fixtures reales de `ui/src/core/__fixtures__/`.
 *
 * El backend manda más claves de las que el cliente lee; las conocidas están
 * tipadas y el resto entra por la firma de índice. Los "booleanos" del XML
 * suelen llegar como string (`esClave: 'true'`, `required: 'true'`).
 */

/**
 * Booleano tal como lo serializa el XML: a veces `true`, a veces `'true'`,
 * `'false'` o `''`. Es `string` y no la unión de literales porque el backend no
 * garantiza los valores (y un JSON importado no los conserva).
 */
export type HistrixBool = boolean | string;

/**
 * `schema.type`. Los conocidos por `core/screenType.js` más los que manda el
 * backend sin contraparte (p. ej. `TreeTable`).
 */
export type HistrixScreenType =
  | 'ficha'
  | 'fichaing'
  | 'cabecera'
  | 'consulta'
  | 'crud'
  | 'abm'
  | 'abm-mini'
  | 'ing'
  | 'grid'
  | 'liveGrid'
  | 'help'
  | 'ayuda'
  | 'tree'
  | 'arbol'
  | 'TreeTable'
  | 'chart'
  | 'map'
  | 'treeView'
  | 'calendar'
  | 'gantt'
  | 'dashboard'
  | 'list'
  | (string & {});

/** `histrix_type` (PascalCase, del tipo de dato o del widget del `<campo>`). */
export type HistrixFieldType =
  | 'Field'
  | 'Varchar'
  | 'Text'
  | 'Integer'
  | 'Tinyint'
  | 'Mediumint'
  | 'Bigint'
  | 'Decimal'
  | 'Numeric'
  | 'CustomNumeric'
  | 'Date'
  | 'Check'
  | 'Radio'
  | 'File'
  | 'Editor'
  | 'Flipswitch'
  | (string & {});

/** Referencia a otro XML: `{ xml, dir }`. */
export interface HistrixXmlRef {
  xml: string;
  dir?: string;
}

/**
 * Contenedor interno de un campo (combo remoto, grilla `ing` de un fichaing,
 * helper `object`). `uri` = `"<xml>&dir=<dir>&<param>=<valor>&..."`, ver
 * `core/schemaUri.js`.
 */
export interface HistrixInnerContainer extends HistrixXmlRef {
  uri: string;
  relationship?: unknown[] | Record<string, unknown>;
  /** El contenedor no trae filas (no hace falta pedirlas). */
  empty?: boolean;
  type?: string;
  [key: string]: unknown;
}

/** Ayuda (F2/lupa) de un campo: la consulta a abrir y qué campo completa. */
export interface HistrixHelpContainer extends HistrixXmlRef {
  help_field: string;
  /** XML que abre la ayuda (para resolverla stateless). */
  parent?: HistrixXmlRef;
  /** Campos del form que viajan como contexto a la ayuda. */
  context_fields?: string[];
  uri?: string;
  dataUri?: string;
  [key: string]: unknown;
}

/** Parámetro de un `helpers.link`: abrir el destino con `target = valor de source`. */
export interface HistrixLinkParameter {
  source: string;
  target: string;
  operator?: '=' | (string & {});
}

/** Botón/enlace a otro XML (`helpers.link`), ver `core/links.js`. */
export interface HistrixLinkHelper {
  /** Puede faltar (link sin destino): `resolveHelperLinkPath` devuelve `''`. */
  xml?: string;
  dir?: string;
  type?: 'link' | (string & {});
  linkloader?: string | null;
  linktarget?: string | null;
  parameters?: HistrixLinkParameter[];
  [key: string]: unknown;
}

/** `field.helpers`. */
export interface HistrixHelper {
  link?: HistrixLinkHelper;
  media?: unknown;
  [key: string]: unknown;
}

/** `<actualiza>`: al cambiar `field`, recargar `targetField` desde `xml`. */
export interface HistrixUpdateField {
  field: string;
  targetField: string;
  xml: string;
  filter?: string;
}

/**
 * Opciones de un combo. `options_sorted` trae las claves con un espacio
 * antepuesto (`' 4'`) para que el orden de inserción sobreviva al JSON; ver
 * `core/options.js`.
 */
export type HistrixOptions = Record<string, string | Record<string, unknown> | null> | unknown[];

/** Un `<campo>` del XML, tal como lo serializa `Field::getSchema`. */
export interface HistrixFieldSchema {
  name: string;
  title?: string;
  label?: string;
  histrix_type?: HistrixFieldType;
  /** `type` del input HTML (text, number, date…), no el de la pantalla. */
  type?: string;
  inputType?: string;
  hidden?: boolean;
  hidden_column?: boolean;
  editable?: boolean;
  readonly?: HistrixBool;
  disabled?: HistrixBool;
  deshabilitado?: HistrixBool;
  required?: HistrixBool;
  oblig?: string;
  /** Clave primaria: llega como string `'true'`. */
  esClave?: HistrixBool;
  isSelect?: HistrixBool;
  options?: HistrixOptions | null;
  options_sorted?: HistrixOptions;
  default_option_value?: string | number | null;
  defaultvalue?: string | number;
  /** `false` cuando no tiene. */
  innerContainer?: HistrixInnerContainer | boolean;
  helpContainer?: HistrixHelpContainer;
  helpers?: HistrixHelper;
  help_key?: string;
  update_fields?: HistrixUpdateField[];
  /** `{ destino: expresión }` de los `<jseval>`. */
  computed_fields?: Record<string, string> | null;
  computed_totals?: string;
  /** JSON (con entidades HTML) de reglas `{formula, targetField, ajaxupdate}`, ver `core/dataFormulas.js`. */
  'data-formulas'?: string;
  'data-role'?: string;
  'data-refreshfields'?: string;
  'data-options'?: Record<string, unknown>;
  'data-a-dec'?: string;
  'data-a-sep'?: string;
  'data-m-dec'?: string;
  'data-alt-dec'?: string;
  enabler?: string;
  /** Uso interno del backend: nunca mandarlo en el payload. */
  isExpression?: boolean;
  local?: boolean;
  sum?: string | null;
  sortable?: boolean;
  autocomplete?: string;
  align?: string;
  colspan?: string | number;
  size?: string | number;
  max_length?: string | number;
  decimales?: string | number;
  step?: string;
  mask?: string;
  /** Mensaje de la validación `mask` (atributo `errorMessage` del XML), si el backend lo manda. */
  errorMessage?: string;
  multiple?: HistrixBool;
  placeholder?: string;
  style?: string;
  class?: string;
  cell_class?: string;
  column_style?: string;
  form_style?: string;
  label_style?: string;
  /** `<detalle>` del campo. */
  detail?: string[];
  path?: string;
  dir?: string;
  [key: string]: unknown;
}

/** Un filtro de `schema.filters` (además de todos los atributos de su `<campo>`). */
export interface HistrixFilter extends Omit<Partial<HistrixFieldSchema>, 'name' | 'colspan' | 'deshabilitado'> {
  uid?: string;
  id?: string;
  campo: string;
  operador?: string;
  label?: string;
  valor?: string | number;
  opcion?: string;
  deshabilitado?: string;
  colspan?: string | null;
  grupo?: string;
  modificador?: string;
  oplogico?: string;
  [key: string]: unknown;
}

/** Condición fija de la pantalla (`schema.conditions[campo][expresión]`). */
export interface HistrixCondition {
  OpLogico?: string;
  operador: string;
  valor: string | number;
  premodificador?: string;
  tipo?: string;
  grupo?: string | null;
  fixed?: boolean | string;
  [key: string]: unknown;
}

/** Configuración de paginación server-side (`schema.pagination`). */
export interface HistrixPaginationConfig {
  enabled: boolean;
  page_size: number;
  offset: number;
  max_limit: number;
}

/** Detalle (`<detalle>`) de la pantalla cuando viene como objeto. */
export interface HistrixDetail extends HistrixXmlRef {
  dynamic?: boolean;
  xml_field?: string | null;
  has_detail_field?: boolean | null;
  inline?: boolean;
  params?: Array<{ field: string; param: string }>;
  row_key?: string;
  [key: string]: unknown;
}

/** Widget de un dashboard. */
export interface HistrixWidget {
  id: string;
  uid?: string;
  title?: string;
  text?: string;
  url?: string;
  target?: HistrixXmlRef;
  iframe?: string;
  width?: string | null;
  height?: string | null;
  style?: string | null;
  [key: string]: unknown;
}

/** La pantalla, tal como la serializa `Container::getSchema`. */
export interface HistrixScreenSchema {
  type: HistrixScreenType;
  title?: string;
  /** `{ nombre: campo }`; ausente en un dashboard. */
  fields?: Record<string, HistrixFieldSchema>;
  filters?: HistrixFilter[];
  /** Valores iniciales (form) o vacío. */
  values?: Record<string, unknown> | unknown[];
  conditions?: Record<string, Record<string, HistrixCondition>> | unknown[];
  can_insert?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  can_process?: boolean;
  insertButton?: boolean;
  updateButton?: boolean;
  processButton?: string | boolean;
  process_next_step?: boolean;
  readonly?: boolean;
  redirect?: string | null;
  preFetch?: boolean;
  auto_filter?: boolean;
  pagination?: HistrixPaginationConfig;
  detail?: boolean | HistrixDetail;
  inline_detail?: boolean | string;
  header?: boolean | HistrixXmlRef;
  export?: boolean;
  import?: boolean;
  pdf?: boolean;
  print?: boolean;
  charts?: unknown[];
  widgets?: Record<string, HistrixWidget>;
  defaultView?: string | null;
  /** Directorio de archivos del XML (p. ej. `fotos/articulos`). */
  path?: string;
  /** Id de la instancia en el backend (stateful). */
  instance?: string;
  parentField?: string;
  childField?: string;
  fieldValidations?: unknown[];
  formValidations?: unknown[];
  observation?: string;
  projection?: Record<string, unknown>;
  number_of_fields?: number;
  width?: string | null;
  [key: string]: unknown;
}

/** Verbos permitidos sobre la pantalla (`resources`): `{ GET: url, POST: url, … }`. */
export type HistrixResources = Partial<
  Record<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PROCESS' | 'EXPORT' | 'OPTIONS', string>
>;

/** Respuesta de `GET /schema/{xml}`. */
export interface SchemaResponse {
  resources: HistrixResources;
  schema: HistrixScreenSchema;
}

/** Una fila de `GET /app/{xml}`: `{ campo: valor }` + atributos de DataTables. */
export type HistrixRow = Record<string, unknown> & {
  DT_RowId?: string;
  DT_RowAttr?: Record<string, string>;
  _detail?: string;
};

/** `pagination` de `GET /app/{xml}?_limit=N` (`PaginationRequest::envelope`). */
export interface HistrixPagination {
  limit: number;
  offset: number;
  count: number;
  has_more: boolean;
  page?: number;
  total?: number;
  next: string | null;
}

/** `{ data }` sin paginar. */
export interface AppDataPlain<Row = HistrixRow> {
  data: Row[];
}

/** `{ data, pagination }` con `_limit`. */
export interface AppDataPaginated<Row = HistrixRow> {
  data: Row[];
  pagination: HistrixPagination;
}

/** Formato DataTables, con `_dt`. */
export interface AppDataTables<Row = HistrixRow> {
  data: Row[];
  draw?: number;
  recordsTotal: number;
  recordsFiltered: number;
  paging?: Record<string, unknown>;
}

/** Respuesta de `GET /app/{xml}`. */
export type AppDataResponse<Row = HistrixRow> = AppDataPlain<Row> | AppDataPaginated<Row> | AppDataTables<Row>;
