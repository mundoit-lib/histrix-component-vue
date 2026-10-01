/**
 * Mide qué porcentaje de los `<jseval>` reales del backend Histrix entiende
 * core/formula.js.
 *
 * Recorre `<raíz>/{modules,database,admin}` buscando `.xml`, extrae el cuerpo de
 * cada `<jseval>` (con CDATA y entidades XML) y lo pasa por el parser. Reporta
 * cuántos bloques (y cuántas fórmulas distintas) parsea, cuántos no, y el top de
 * tokens que aparecen en las fórmulas que fallan.
 *
 * Uso:
 *   node ui/dev/scripts/jseval-coverage.mjs [raíz-histrix] [--module ruta/a/formula.js] [--top N] [--samples N]
 *
 * La raíz por defecto es `$HISTRIX_ROOT` o `~/proyectos/histrix`. `--module`
 * permite medir otra versión del parser (p. ej. la de `main`, para el "antes").
 * Si el módulo no exporta `parseFormula`, se aproxima evaluando con todos los
 * campos en 1.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  if (i === -1) return def;
  const [, value] = args.splice(i, 2);
  return value;
};
const modulePath = opt('--module', new URL('../../src/core/formula.js', import.meta.url).pathname);
const top = Number(opt('--top', 20));
const samples = Number(opt('--samples', 0));
const root = resolve(args[0] || process.env.HISTRIX_ROOT || join(homedir(), 'proyectos', 'histrix'));

const mod = await import(pathToFileURL(resolve(modulePath)).href);
const supported = new Set(mod.formulaWhitelist || []);
const parses = mod.parseFormula
  ? (f) => mod.parseFormula(f) !== null
  : (f) => mod.evaluateFormula(f, () => 1) !== undefined;

/** Lista recursiva de `.xml` bajo `dir` (ignora lo que no se puede leer). */
function* xmlFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const path = join(dir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* xmlFiles(path);
    else if (name.toLowerCase().endsWith('.xml')) yield path;
  }
}

const ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

/** Cuerpo de un `<jseval>` tal como lo ve el navegador. */
function decode(body) {
  return body
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(lt|gt|amp|quot|apos);/g, (_, e) => ENTITIES[e])
    .trim();
}

/** Tokens "sospechosos" de una fórmula que no parsea (cada uno cuenta una vez). */
function suspects(formula) {
  const found = new Set();
  const re =
    /\b(?:var|let|const|if|else|return|new|function|this|typeof)\b|(?:\b[A-Za-z_$][\w$]*\.)?\.?[A-Za-z_$][\w$]*\s*\(|\.[A-Za-z_$][\w$]*|[;{}[\]$#@`\\]|[!=<>]=*|&&?|\|\|?|[?:%]/g;
  for (const m of formula.matchAll(re)) {
    const tok = m[0].replace(/\s+/g, '');
    const name = tok.replace(/^\./, '').replace(/\($/, '');
    if (supported.has(name)) continue;
    found.add(tok);
  }
  return found;
}

let files = 0;
let blocks = 0;
let ok = 0;
const unique = new Map(); // fórmula → parsea
const missing = new Map(); // token → nº de bloques que fallan y lo contienen
const failedSamples = [];

for (const sub of ['modules', 'database', 'admin']) {
  for (const file of xmlFiles(join(root, sub))) {
    const xml = readFileSync(file, 'latin1');
    if (!xml.includes('<jseval')) continue;
    files++;
    for (const m of xml.matchAll(/<jseval\b[^>]*?(?<!\/)>([\s\S]*?)<\/jseval>/gi)) {
      const formula = decode(m[1]);
      if (!formula) continue;
      blocks++;
      let good = unique.get(formula);
      if (good === undefined) {
        good = parses(formula);
        unique.set(formula, good);
      }
      if (good) {
        ok++;
        continue;
      }
      for (const tok of suspects(formula)) missing.set(tok, (missing.get(tok) || 0) + 1);
      if (failedSamples.length < samples) failedSamples.push(formula.replace(/\s+/g, ' '));
    }
  }
}

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : '0.0');
const uniqueOk = [...unique.values()].filter(Boolean).length;

console.log(`raíz:      ${root}`);
console.log(`parser:    ${modulePath}${mod.parseFormula ? '' : ' (sin parseFormula: aproximado evaluando)'}`);
console.log(`archivos:  ${files}`);
console.log(`bloques:   ${blocks}  →  parsean ${ok} (${pct(ok, blocks)} %), fallan ${blocks - ok}`);
console.log(`distintas: ${unique.size}  →  parsean ${uniqueOk} (${pct(uniqueOk, unique.size)} %)`);
console.log(`\ntop ${top} tokens en bloques que fallan:`);
for (const [tok, n] of [...missing].sort((a, b) => b[1] - a[1]).slice(0, top)) {
  console.log(`  ${String(n).padStart(6)}  ${tok}`);
}
if (failedSamples.length) {
  console.log('\nmuestras que fallan:');
  for (const f of failedSamples) console.log(`  ${f.slice(0, 160)}`);
}
