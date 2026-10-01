/**
 * Evaluador de fórmulas de Histrix (`computed_fields` / `<jseval>`).
 *
 * El legacy (`js/histrix.js`, `H._calculateField`) reemplaza los nombres de campo
 * por sus valores y ejecuta el resultado con `eval`, así que en los `<jseval>`
 * reales hay de todo: `toFixed`, ternarios, comparaciones, `Math.*`, `substring`,
 * `aFecha`, `Date.parse`… Acá NO se usa `eval` ni `new Function`: un tokenizer y
 * un parser Pratt arman un árbol que se evalúa con un subconjunto de JavaScript.
 *
 * Soporta:
 * - números, strings (`'…'`/`"…"`), `true`/`false`/`null`/`undefined`;
 * - aritmética (`+ - * / %`), comparaciones (`== != === !== < <= > >=`),
 *   lógicos (`&& || !`), ternario `a ? b : c` y paréntesis, con la semántica de JS;
 * - funciones y métodos de una whitelist (`formulaWhitelist`): `x.toFixed(2)`,
 *   `s.substring(0, 3)`, `Math.round(x)`, `aFecha(fecha)`, `mifloat(x)`…;
 * - `row.campo` / `parent.campo` si el call-site pasa `{ row, parent }`.
 *
 * Cualquier otra cosa (identificador o método fuera de la whitelist, `;`, `var`,
 * asignaciones, jQuery…) invalida la fórmula: devuelve `undefined` sin lanzar.
 *
 * Los valores de campo se normalizan como el legacy (`replaceFormula` + `mifloat`):
 * `null`/`''` → 0, strings numéricos (también `'1.234,5'`) → number; el resto
 * queda como string. Las fechas (`aFecha`, `straFecha`, `Date.parse`) son
 * timestamps en ms, así comparar y restar fechas da lo mismo que con `Date`.
 */

/** Funciones globales permitidas. */
const FUNCTIONS = {
  parseInt: (s, radix) => Number.parseInt(s, radix),
  parseFloat: (s) => Number.parseFloat(s),
  Number: (v) => Number(v),
  String: (v) => String(v),
  isNaN: (v) => Number.isNaN(Number(v)),
  aFecha,
  straFecha,
  mifloat
};

/** `Math.*` permitidos. */
const MATH = {
  round: Math.round,
  ceil: Math.ceil,
  floor: Math.floor,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  trunc: Math.trunc
};

/** Funciones de otros namespaces (`Date.parse`). */
const NAMESPACED = {
  'Date.parse': (v) => (typeof v === 'number' ? v : Date.parse(v))
};

/** Constantes de namespace (`Number.EPSILON`, `Math.PI`). */
const CONSTANTS = {
  'Number.EPSILON': Number.EPSILON,
  'Math.PI': Math.PI
};

/** Métodos permitidos sobre un valor (`x.toFixed(2)`). */
const METHODS = {
  toFixed: (v, digits) => Number(v).toFixed(digits),
  substring: (v, ...a) => String(v).substring(...a),
  substr: (v, ...a) => String(v).substr(...a),
  slice: (v, ...a) => String(v).slice(...a),
  toUpperCase: (v) => String(v).toUpperCase(),
  toLowerCase: (v) => String(v).toLowerCase(),
  trim: (v) => String(v).trim(),
  indexOf: (v, ...a) => String(v).indexOf(...a),
  toString: (v) => String(v)
};

/** Scopes accesibles con `scope.campo` si el call-site los provee. */
const SCOPES = new Set(['row', 'parent']);

/** Nombres de la whitelist (los usa el script de medición). */
export const formulaWhitelist = [
  ...Object.keys(FUNCTIONS),
  ...Object.keys(MATH).map((k) => `Math.${k}`),
  ...Object.keys(NAMESPACED),
  ...Object.keys(CONSTANTS),
  ...Object.keys(METHODS),
  'length'
];

const RESERVED = new Set(['Math', 'Date', 'Number', 'String', ...Object.keys(FUNCTIONS), ...SCOPES]);

const LITERALS = { true: true, false: false, null: null, undefined: undefined };

/** Puntuación ordenada por longitud desc (se matchea la más larga). */
const PUNCT = [
  '===',
  '!==',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '<',
  '>',
  '+',
  '-',
  '*',
  '/',
  '%',
  '!',
  '?',
  ':',
  '(',
  ')',
  ',',
  '.'
];

/** Binding power de los operadores binarios (mayor = liga más fuerte). */
const BINARY = {
  '||': 3,
  '&&': 4,
  '==': 5,
  '!=': 5,
  '===': 5,
  '!==': 5,
  '<': 6,
  '<=': 6,
  '>': 6,
  '>=': 6,
  '+': 7,
  '-': 7,
  '*': 8,
  '/': 8,
  '%': 8
};
const TERNARY_BP = 2;
const UNARY_BP = 9;
const POSTFIX_BP = 10;

const ESCAPES = { n: '\n', t: '\t', r: '\r' };

/** Tokeniza la fórmula. Lanza ante un carácter no soportado. */
function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const prev = tokens[tokens.length - 1];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '"' || c === "'") {
      let s = '';
      i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\' && i + 1 < src.length) {
          i++;
          s += ESCAPES[src[i]] ?? src[i];
        } else {
          s += src[i];
        }
        i++;
      }
      if (i >= src.length) throw new SyntaxError('string sin cerrar');
      i++;
      tokens.push({ type: 'str', value: s });
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? '') && !isValueEnd(prev))) {
      let n = '';
      while (i < src.length && /[0-9.]/.test(src[i])) {
        n += src[i];
        i++;
      }
      const value = Number(n);
      if (Number.isNaN(value)) throw new SyntaxError(`número inválido: ${n}`);
      tokens.push({ type: 'num', value });
    } else if (/[A-Za-z_]/.test(c)) {
      let id = '';
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) {
        id += src[i];
        i++;
      }
      tokens.push({ type: 'id', value: id });
    } else {
      const p = PUNCT.find((sym) => src.startsWith(sym, i));
      if (!p) throw new SyntaxError(`carácter no soportado: ${c}`);
      tokens.push({ type: 'p', value: p });
      i += p.length;
    }
  }
  return tokens;
}

/** ¿El token cierra un valor? (para distinguir `x.5` de `.5`). */
function isValueEnd(t) {
  return !!t && (t.type === 'id' || t.type === 'num' || t.type === 'str' || (t.type === 'p' && t.value === ')'));
}

/** Parser Pratt: tokens → árbol. Lanza ante sintaxis inválida o fuera de la whitelist. */
function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const isP = (t, v) => t && t.type === 'p' && t.value === v;
  const expectP = (v) => {
    if (!isP(tokens[pos], v)) throw new SyntaxError(`se esperaba "${v}"`);
    pos++;
  };

  function prefix() {
    const t = tokens[pos++];
    if (!t) throw new SyntaxError('fin inesperado');
    if (t.type === 'num' || t.type === 'str') return { t: 'lit', v: t.value };
    if (t.type === 'id') {
      if (Object.hasOwn(LITERALS, t.value)) return { t: 'lit', v: LITERALS[t.value] };
      return { t: 'id', name: t.value };
    }
    if (t.value === '(') {
      const e = expr(0);
      expectP(')');
      return e;
    }
    if (t.value === '-' || t.value === '+' || t.value === '!') {
      return { t: 'unary', op: t.value, arg: expr(UNARY_BP) };
    }
    throw new SyntaxError(`token inesperado: ${t.value}`);
  }

  function args() {
    const list = [];
    if (isP(peek(), ')')) {
      pos++;
      return list;
    }
    for (;;) {
      list.push(expr(0));
      if (isP(peek(), ',')) {
        pos++;
      } else {
        expectP(')');
        return list;
      }
    }
  }

  function expr(minBp) {
    let left = prefix();
    for (;;) {
      const t = peek();
      if (!t) break;
      if (t.type !== 'p') throw new SyntaxError(`token inesperado: ${t.value}`);
      if (t.value === '(' || t.value === '.') {
        if (POSTFIX_BP <= minBp) break;
        pos++;
        if (t.value === '(') {
          left = call(left, args());
        } else {
          const prop = tokens[pos++];
          if (!prop || prop.type !== 'id') throw new SyntaxError('se esperaba un nombre tras "."');
          left = { t: 'member', obj: left, prop: prop.value };
        }
      } else if (t.value === '?') {
        if (TERNARY_BP <= minBp) break;
        pos++;
        const a = expr(0);
        expectP(':');
        left = { t: 'cond', test: check(left), a, b: expr(TERNARY_BP - 1) };
      } else if (Object.hasOwn(BINARY, t.value)) {
        const bp = BINARY[t.value];
        if (bp <= minBp) break;
        pos++;
        left = { t: 'bin', op: t.value, l: check(left), r: expr(bp) };
      } else {
        break; // `)`, `,`, `:` los consume quien corresponde
      }
    }
    return check(left);
  }

  const tree = expr(0);
  if (pos !== tokens.length) throw new SyntaxError(`token inesperado: ${tokens[pos].value}`);
  return tree;
}

/** Nombre calificado de un `member` sobre identificador (`Math.round`), o null. */
function qualified(node) {
  return node.t === 'member' && node.obj.t === 'id' ? `${node.obj.name}.${node.prop}` : null;
}

/** Arma un nodo de llamada validando la whitelist. */
function call(callee, list) {
  if (callee.t === 'id' && Object.hasOwn(FUNCTIONS, callee.name)) {
    return { t: 'call', fn: FUNCTIONS[callee.name], args: list };
  }
  const q = qualified(callee);
  if (q?.startsWith('Math.') && Object.hasOwn(MATH, callee.prop)) {
    return { t: 'call', fn: MATH[callee.prop], args: list };
  }
  if (q && Object.hasOwn(NAMESPACED, q)) return { t: 'call', fn: NAMESPACED[q], args: list };
  if (callee.t === 'member' && Object.hasOwn(METHODS, callee.prop)) {
    return { t: 'method', fn: METHODS[callee.prop], obj: check(callee.obj), args: list };
  }
  throw new SyntaxError('función fuera de la whitelist');
}

/** Valida un nodo que quedó como valor (no como callee). */
function check(node) {
  if (node.t === 'id' && RESERVED.has(node.name)) throw new SyntaxError(`${node.name} no es un campo`);
  if (node.t === 'member') {
    const q = qualified(node);
    if (q && Object.hasOwn(CONSTANTS, q)) return { t: 'lit', v: CONSTANTS[q] };
    if (node.obj.t === 'id' && SCOPES.has(node.obj.name)) return { t: 'scoped', scope: node.obj.name, name: node.prop };
    if (node.prop === 'length') return { t: 'length', obj: check(node.obj) };
    throw new SyntaxError(`propiedad fuera de la whitelist: ${node.prop}`);
  }
  return node;
}

/** Señal interna: falta un campo en el contexto → la fórmula no es evaluable. */
const MISSING = Symbol('missing');

/** ¿Es un número con formato local (`1.234,5`, `12,5`)? */
const LOCAL_NUMBER = /^-?(\d{1,3}(\.\d{3})+(,\d+)?|\d+,\d+)$/;

/** Normaliza el valor crudo de un campo como el legacy (`replaceFormula`). */
function normalize(raw) {
  if (raw === undefined) throw MISSING;
  if (raw === null || raw === '') return 0;
  if (typeof raw === 'number' || typeof raw === 'boolean') return raw;
  if (typeof raw === 'object') {
    // celdas-objeto de la tabla: `{ value }` / `{ _ }`
    const inner = raw.value !== undefined ? raw.value : raw._;
    return normalize(inner);
  }
  const s = String(raw).trim();
  if (s === '') return 0;
  if (!Number.isNaN(Number(s))) return Number(s);
  if (LOCAL_NUMBER.test(s)) return mifloat(s);
  return String(raw);
}

/* biome-ignore lint/suspicious/noDoubleEquals: semántica laxa de JS, como el eval del legacy (sólo primitivos). */
const looseEq = (a, b) => a == b;

/** Evalúa el árbol. */
function run(node, ctx) {
  switch (node.t) {
    case 'lit':
      return node.v;
    case 'id':
      return normalize(ctx.getValue ? ctx.getValue(node.name) : undefined);
    case 'scoped': {
      const scope = ctx[node.scope];
      if (!scope || typeof scope !== 'object' || !Object.hasOwn(scope, node.name)) throw MISSING;
      return normalize(scope[node.name]);
    }
    case 'length':
      return String(run(node.obj, ctx)).length;
    case 'unary': {
      const v = run(node.arg, ctx);
      if (node.op === '!') return !v;
      return node.op === '-' ? -v : +v;
    }
    case 'cond':
      return run(node.test, ctx) ? run(node.a, ctx) : run(node.b, ctx);
    case 'call':
      return node.fn(...node.args.map((a) => run(a, ctx)));
    case 'method':
      return node.fn(run(node.obj, ctx), ...node.args.map((a) => run(a, ctx)));
    case 'bin': {
      if (node.op === '&&') return run(node.l, ctx) && run(node.r, ctx);
      if (node.op === '||') return run(node.l, ctx) || run(node.r, ctx);
      const a = run(node.l, ctx);
      const b = run(node.r, ctx);
      switch (node.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
        case '%':
          return a % b;
        case '==':
          return looseEq(a, b);
        case '!=':
          return !looseEq(a, b);
        case '===':
          return a === b;
        case '!==':
          return a !== b;
        case '<':
          return a < b;
        case '<=':
          return a <= b;
        case '>':
          return a > b;
        default:
          return a >= b;
      }
    }
    default:
      throw new SyntaxError(`nodo desconocido: ${node.t}`);
  }
}

/** Quita los `;` finales (el legacy hace `eval('valor= ' + f + ';')`). */
function clean(formula) {
  return formula.trim().replace(/[;\s]+$/, '');
}

/**
 * Parsea una fórmula sin evaluarla.
 *
 * @param {string} formula
 * @returns {object|null} el árbol, o `null` si la sintaxis es inválida o usa algo
 *   fuera de la whitelist.
 */
export function parseFormula(formula) {
  if (!formula || typeof formula !== 'string') return null;
  try {
    const tokens = tokenize(clean(formula));
    if (tokens.length === 0) return null;
    return parse(tokens);
  } catch (_e) {
    return null;
  }
}

/**
 * Evalúa una fórmula reemplazando los nombres de campo por sus valores.
 *
 * @param {string} formula - p. ej. `"precio * cantidad * 1.21"` o
 *   `"(precio * cantidad).toFixed(2)"`.
 * @param {(name: string) => *} getValue - resuelve el valor de un campo.
 *   `null`/`''` → 0, `'5'` → 5, `'1.234,5'` → 1234.5. Si devuelve `undefined`,
 *   la fórmula no es evaluable (el campo no existe en el contexto).
 * @param {object} [opts]
 * @param {object} [opts.row] - fila actual, para `row.campo`.
 * @param {object} [opts.parent] - valores del padre, para `parent.campo`.
 * @param {number} [opts.round] - si viene, redondea un resultado numérico a esa
 *   cantidad de decimales (el legacy usa 2).
 * @returns {*} el resultado (number, string o boolean), o `undefined` si la
 *   fórmula está vacía, falta un campo, la sintaxis es inválida, usa algo fuera
 *   de la whitelist o da `NaN`.
 */
export function evaluateFormula(formula, getValue, opts = {}) {
  const tree = parseFormula(formula);
  if (!tree) return undefined;
  let result;
  try {
    result = run(tree, { getValue, row: opts.row, parent: opts.parent });
  } catch (_e) {
    return undefined; // campo faltante o error en tiempo de evaluación (p. ej. toFixed(200))
  }
  if (typeof result === 'number') {
    if (Number.isNaN(result)) return undefined;
    if (opts.round !== undefined && Number.isFinite(result)) {
      const f = 10 ** opts.round;
      return Math.round((result + Number.EPSILON) * f) / f;
    }
  }
  return result;
}

/**
 * Evalúa una validación (`fielddestino="__EVAL"`). Como el legacy, es inválida
 * si el resultado `== false` (`false`, `0`, `''`, `'0'`). Una fórmula que no se
 * puede evaluar no bloquea: devuelve `true`.
 *
 * @param {string} formula
 * @param {(name: string) => *} getValue
 * @param {object} [opts] - igual que en `evaluateFormula`.
 * @returns {boolean}
 */
export function evaluateValidation(formula, getValue, opts) {
  const result = evaluateFormula(formula, getValue, opts);
  if (result === undefined) return true;
  return !looseEq(result, false);
}

/**
 * `dd/mm/yyyy` → timestamp en ms (hora local), como el `aFecha` del legacy
 * (que devolvía un `Date`). Devuelve `NaN` si no es una fecha.
 */
export function aFecha(str) {
  if (typeof str !== 'string') return Number.NaN;
  const s = str.trim();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (!m) return Number.NaN;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

/**
 * `yyyy-mm-dd` o `dd/mm/yyyy` → timestamp en ms (hora local), como el
 * `straFecha` del legacy. Devuelve `NaN` si no es una fecha.
 */
export function straFecha(str) {
  if (typeof str !== 'string') return Number.NaN;
  const s = str.trim();
  if (s.substring(2, 3) === '/') return aFecha(s);
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (!m) return Number.NaN;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

/**
 * Coerción numérica tolerante, como el `mifloat` del legacy:
 * `null`/`''` → 0, `'1.234,5'` → 1234.5, `'1,234.5'` → 1234.5, `'12,5'` → 12.5.
 * Lo que no es numérico → 0.
 */
export function mifloat(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  let s = String(value).trim();
  const comma = s.indexOf(',');
  if (comma >= 0) {
    const dot = s.indexOf('.');
    s = dot >= 0 && comma < dot ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(/,/g, '.');
  }
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}
