#!/usr/bin/env node
/**
 * Captura fixtures reales (schema + datos) del backend Histrix al que apunta
 * `ui/dev/.env`, para testear el core contra contratos reales.
 *
 * Uso (desde la raíz del repo):
 *   node ui/dev/scripts/capture-fixtures.mjs --menu [--out candidatos.json]
 *     Recorre el menú (`GET /menu/phpmen`), pide el schema de cada pantalla y
 *     lista sus rasgos (type, paginación, preFetch, innerContainer, ...) para
 *     elegir qué capturar. No escribe nada en el repo.
 *   node ui/dev/scripts/capture-fixtures.mjs --capture lista.json [--deny "a,b"] [--rename "a=b"]
 *     `lista.json` = [{ "name": "consulta-paginar", "uri": "/app/dir/x.xml?p=1" }]
 *     (no se versiona: son rutas reales del cliente). `--inspect dir` escribe en
 *     `dir` aunque queden rastros, para revisarlos fuera del repo.
 *     Pide `GET /schema/{xml}` y `GET /app/{xml}?_limit=5`, anonimiza y guarda
 *     `ui/src/core/__fixtures__/{name}.schema.json` y `.data.json`.
 *
 * Anonimización (el repo es público): todo valor de datos (filas, `values`,
 * labels de opciones, valores de filtros) se reemplaza por uno con la misma
 * forma (letras por letras, dígitos por dígitos, conserva separadores), con un
 * mapeo determinístico para que el mismo valor dé lo mismo en schema y datos.
 * Las fechas, los vacíos y los flags cortos se conservan. Al final se busca en
 * lo generado la base, el host, los términos de `--deny` y
 * los mails/CUIT originales: si aparece alguno, no se escribe nada.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(here, '../../src/core/__fixtures__');

function readEnv(file) {
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1] || '';
}

const env = readEnv(resolve(here, '../.env'));
const API = `${env.VITE_HISTRIX_HOST}/api/db/${env.VITE_HISTRIX_DB}`;
let token = '';

async function login() {
  const res = await fetch(`${API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      username: env.VITE_TEST_EMAIL,
      password: env.VITE_TEST_PASSWORD,
      grant_type: 'password',
      client_id: env.VITE_CLIENT_ID,
      client_secret: env.VITE_CLIENT_SECRET
    })
  });
  if (!res.ok) throw new Error(`login: HTTP ${res.status}`);
  token = (await res.json()).access_token;
}

async function get(path, params = {}) {
  const [base, query = ''] = path.split('?');
  const qs = new URLSearchParams(query);
  for (const [k, v] of Object.entries(params)) qs.set(k, v);
  const url = `${API}${base}${qs.size ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: null };
  }
}

/** `/app/dir/x.xml?a=1` → `/dir/x.xml?a=1` (la parte que va después de /schema o /app). */
const appPath = (uri) => uri.replace(/^\/?app\//, '/');

function menuUris(tree, acc = []) {
  for (const node of tree || []) {
    if (node.uri?.startsWith('/app/')) acc.push({ uri: node.uri, title: node.title });
    menuUris(node.childs, acc);
  }
  return acc;
}

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

/** Rasgos del schema que interesan para elegir fixtures. */
function traits(schema) {
  const fields = Object.values(schema.fields || {});
  const any = (fn) => fields.some(fn);
  return {
    type: schema.type,
    fields: fields.length,
    pagination: Boolean(schema.pagination?.enabled),
    preFetch: schema.preFetch === true,
    innerContainer: any((f) => f.innerContainer),
    innerIng: any((f) => f.innerContainer?.type === 'ing' || /ing/.test(f.innerContainer?.uri || '')),
    helpContainer: any((f) => f.helpContainer),
    dataFormulas: any((f) => f['data-formulas']),
    updateFields: any((f) => (Array.isArray(f.update_fields) ? f.update_fields.length : f.update_fields)),
    helperLink: any((f) => f.helpers?.link),
    optionsSorted: any((f) => Object.keys(f.options_sorted || {}).some((k) => k.startsWith(' '))),
    options: any((f) => f.options),
    filters: (schema.filters || []).length
  };
}

async function listMenu() {
  await login();
  const menu = await get('/menu/phpmen', { platform: 'app' });
  const uris = menuUris(menu.body?.tree);
  const rows = await pool(uris, 4, async ({ uri }) => {
    const res = await get(`/schema${appPath(uri)}`);
    const schema = res.body?.schema || res.body;
    if (res.status !== 200 || !schema?.type) return { uri, status: res.status };
    return { uri, ...traits(schema) };
  });
  const out = arg('--out');
  if (out) writeFileSync(out, JSON.stringify(rows, null, 2));
  const byType = {};
  for (const r of rows) byType[r.type || `error ${r.status}`] = (byType[r.type || `error ${r.status}`] || 0) + 1;
  console.log(`${rows.length} pantallas en el menú`, byType);
}

// ---------------------------------------------------------------- anonimización

const DATE_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}:\d{2}(:\d{2})?$/;
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = LOWER.toUpperCase();
const seen = new Map();

/** Mismo valor → mismo reemplazo, con la misma forma (letras, dígitos, separadores). */
function scramble(value) {
  // Enteros de 7+ dígitos (CUIT, DNI, teléfonos) se tratan como dato; el resto de los números queda.
  if (typeof value === 'number')
    return Number.isInteger(value) && value >= 1e6 ? Number(scramble(String(value))) : value;
  if (typeof value !== 'string') return value;
  const s = value.trim();
  if (s === '' || s.length <= 2 || DATE_RE.test(s)) return value;
  if (/^-?\d+([.,]\d+)?$/.test(s) && !/^\d{7,}$/.test(s)) return value;
  if (/^(true|false|null|S|N|SI|NO)$/i.test(s)) return value;
  if (seen.has(value)) return seen.get(value);
  if (s.includes('@')) {
    const mail = `usuario${seen.size + 1}@example.com`;
    seen.set(value, mail);
    return mail;
  }
  const h = createHash('sha256').update(`histrix-fixture:${value}`).digest();
  let i = 0;
  const next = () => h[i++ % h.length];
  const out = value
    .split('')
    .map((c) => {
      if (/[0-9]/.test(c)) return String(next() % 10);
      if (/[a-zà-ÿ]/.test(c)) return LOWER[next() % 26];
      if (/[A-ZÀ-ß]/.test(c)) return UPPER[next() % 26];
      return c;
    })
    .join('');
  seen.set(value, out);
  return out;
}

/** Todos los strings de un valor (fila, objeto de values) scrambleados; los números y booleanos quedan. */
function scrambleDeep(value, keyOk = () => true) {
  if (Array.isArray(value)) return value.map((v) => scrambleDeep(v, keyOk));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, keyOk(k) ? scrambleDeep(v, keyOk) : v]));
  }
  return scramble(value);
}

/** Claves de fila que son estructura (paths, ids de DataTables), no datos. */
const ROW_STRUCTURAL = new Set(['DT_RowId', 'DT_RowAttr', 'DT_RowClass', '_detail', 'detailpath', '_class']);

/** Tope de opciones por combo: alcanza para la forma y evita fixtures de megas. */
const MAX_OPTIONS = 20;

function anonymizeOptions(options) {
  if (Array.isArray(options)) {
    return options
      .slice(0, MAX_OPTIONS)
      .map((o) =>
        o && typeof o === 'object'
          ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, scramble(v)]))
          : scramble(o)
      );
  }
  if (options && typeof options === 'object') {
    return Object.fromEntries(
      Object.entries(options)
        .slice(0, MAX_OPTIONS)
        .map(([k, v]) => [scramble(k), scrambleDeep(v)])
    );
  }
  return options;
}

const FIELD_DATA_KEYS = ['default_option_value', 'defaultvalue', 'value', 'valor', 'placeholder'];

function anonymizeField(field) {
  const f = { ...field };
  if (f.options) f.options = anonymizeOptions(f.options);
  if (f.options_sorted) f.options_sorted = anonymizeOptions(f.options_sorted);
  for (const k of FIELD_DATA_KEYS) if (k in f) f[k] = scrambleDeep(f[k]);
  return f;
}

function anonymizeSchema(node) {
  if (Array.isArray(node)) return node.map(anonymizeSchema);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'values') out[k] = scrambleDeep(v);
    // Texto libre del autor del XML: puede describir al cliente.
    else if (k === 'observation') out[k] = v ? 'Observación de ejemplo.' : v;
    else if (k === 'fields' || k === 'columns') {
      out[k] = Array.isArray(v)
        ? v.map((f) => anonymizeSchema(anonymizeField(f)))
        : Object.fromEntries(Object.entries(v || {}).map(([n, f]) => [n, anonymizeSchema(anonymizeField(f))]));
    } else if (k === 'filters' && Array.isArray(v)) out[k] = v.map((f) => anonymizeSchema(anonymizeField(f)));
    else out[k] = anonymizeSchema(v);
  }
  return out;
}

function anonymizeData(body) {
  if (!body || typeof body !== 'object') return body;
  const rows = (list) => (Array.isArray(list) ? list.map((r) => scrambleDeep(r, (k) => !ROW_STRUCTURAL.has(k))) : list);
  const out = { ...body };
  if ('data' in out) out.data = Array.isArray(out.data) ? rows(out.data) : scrambleDeep(out.data);
  if ('aaData' in out) out.aaData = rows(out.aaData);
  if ('values' in out) out.values = scrambleDeep(out.values);
  return out;
}

/**
 * Las URLs absolutas (p. ej. `pagination.next`) apuntan a un backend neutro, y
 * `--rename "jerga=neutro,..."` reemplaza términos propios del cliente (en
 * mayúsculas, minúsculas y capitalizado).
 */
function neutralize(body) {
  let text = JSON.stringify(body)
    .replaceAll(API, 'https://histrix.example/api/db/demo')
    .replaceAll(new URL(env.VITE_HISTRIX_HOST).host, 'histrix.example');
  for (const pair of (arg('--rename') || '').split(',').filter(Boolean)) {
    const [from, to] = pair.split('=').map((t) => t.toLowerCase());
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    text = text.replaceAll(from.toUpperCase(), to.toUpperCase()).replaceAll(cap(from), cap(to)).replaceAll(from, to);
  }
  return JSON.parse(text);
}

const SENSITIVE_RE = /[\w.+-]+@[\w-]+\.[\w.]+|\b(?:20|23|24|27|30|33|34)-?\d{8}-?\d\b/g;

/**
 * Términos que no pueden quedar en el repo público: los de `deny` y cualquier
 * mail o CUIT que viniera en la respuesta original (`raw`).
 */
function leakCheck(text, raw, deny) {
  const hits = [];
  const lower = text.toLowerCase();
  for (const term of deny) if (lower.includes(term.toLowerCase())) hits.push(term);
  const originals = new Set(raw.match(SENSITIVE_RE) || []);
  for (const value of originals) if (text.includes(value)) hits.push(`mail/CUIT original (${value.length} caracteres)`);
  return hits;
}

async function capture(listFile) {
  const list = JSON.parse(readFileSync(listFile, 'utf8'));
  const host = new URL(env.VITE_HISTRIX_HOST).hostname;
  const deny = [env.VITE_HISTRIX_DB, host, ...(arg('--deny') || '').split(',')].filter((t) => t && t.length > 2);
  await login();
  const files = [];
  for (const { name, uri } of list) {
    const path = appPath(uri);
    const schema = await get(`/schema${path}`);
    const data = await get(`/app${path}`, { _limit: 5 });
    if (schema.status !== 200) throw new Error(`${name}: schema HTTP ${schema.status}`);
    const raw = JSON.stringify([schema.body, data.body]);
    files.push([`${name}.schema.json`, neutralize(anonymizeSchema(schema.body)), raw]);
    files.push([
      `${name}.data.json`,
      neutralize(data.status === 200 ? anonymizeData(data.body) : { status: data.status }),
      raw
    ]);
  }
  const leaks = [];
  for (const [file, body, raw] of files) {
    const hits = leakCheck(JSON.stringify(body), raw, deny);
    if (hits.length) leaks.push(`${file}: ${hits.join(', ')}`);
  }
  // `--inspect dir` escribe igual, fuera del repo, para ver dónde quedó cada rastro.
  const outDir = arg('--inspect') || FIXTURES_DIR;
  if (leaks.length) {
    console.error(`Quedan rastros:\n${leaks.join('\n')}`);
    if (!arg('--inspect')) {
      console.error('No se escribió nada.');
      process.exit(1);
    }
  }
  mkdirSync(outDir, { recursive: true });
  for (const [file, body] of files) writeFileSync(join(outDir, file), `${JSON.stringify(body, null, 2)}\n`);
  console.log(`${files.length} archivos en ${outDir}`);
}

if (process.argv.includes('--menu')) await listMenu();
else if (arg('--capture')) await capture(arg('--capture'));
else console.log('Uso: --menu [--out archivo] | --capture lista.json [--deny "a,b"]');
