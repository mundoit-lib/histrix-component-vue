/**
 * Evaluador de CONDICIONES booleanas para las `data-formulas` de Histrix.
 *
 * A diferencia de core/formula.js (aritmético puro para totales/computed_fields),
 * acá se evalúan expresiones lógicas del tipo `tipo_requerimiento_id_rao == 2`
 * o `urgente_rao == 1 && x >= 3`. Devuelve un booleano.
 *
 * Soporta: identificadores (resueltos vía getValue), números, strings entre
 * comillas, aritmética (+ - * /), comparaciones (== === = != !== <> < <= > >=)
 * y lógicos (&& || / and or), con paréntesis. Es seguro (no usa eval): cualquier
 * token no soportado o sintaxis inválida devuelve `false`.
 */

/** Coerción numérica defensiva (null/''/no-numérico → 0). */
function num(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/** ¿Es un valor "verdadero" para la lógica? '', '0', 0, null, undefined → false. */
function truthy(v) {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined || v === '' || v === '0' || v === 0) {
    return false;
  }
  return true;
}

/** ¿Se puede comparar como número? (excluye '' para no tratarlo como 0). */
function isNumeric(v) {
  return v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));
}

/** Igualdad laxa: numérica si ambos son números, si no comparación de strings. */
function looseEq(a, b) {
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return truthy(a) === truthy(b);
  }
  if (isNumeric(a) && isNumeric(b)) {
    return Number(a) === Number(b);
  }
  return String(a) === String(b);
}

/** Comparación (-1/0/1): numérica si ambos son números, si no lexicográfica. */
function cmp(a, b) {
  if (isNumeric(a) && isNumeric(b)) {
    return Number(a) - Number(b);
  }
  const sa = String(a);
  const sb = String(b);
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

const OPERATORS = {
  '||': { prec: 1, fn: (a, b) => truthy(a) || truthy(b) },
  '&&': { prec: 2, fn: (a, b) => truthy(a) && truthy(b) },
  '==': { prec: 3, fn: (a, b) => looseEq(a, b) },
  '===': { prec: 3, fn: (a, b) => looseEq(a, b) },
  '=': { prec: 3, fn: (a, b) => looseEq(a, b) },
  '!=': { prec: 3, fn: (a, b) => !looseEq(a, b) },
  '!==': { prec: 3, fn: (a, b) => !looseEq(a, b) },
  '<>': { prec: 3, fn: (a, b) => !looseEq(a, b) },
  '<': { prec: 3, fn: (a, b) => cmp(a, b) < 0 },
  '<=': { prec: 3, fn: (a, b) => cmp(a, b) <= 0 },
  '>': { prec: 3, fn: (a, b) => cmp(a, b) > 0 },
  '>=': { prec: 3, fn: (a, b) => cmp(a, b) >= 0 },
  '+': { prec: 4, fn: (a, b) => num(a) + num(b) },
  '-': { prec: 4, fn: (a, b) => num(a) - num(b) },
  '*': { prec: 5, fn: (a, b) => num(a) * num(b) },
  '/': { prec: 5, fn: (a, b) => num(a) / num(b) }
};

// Símbolos de operador ordenados por longitud desc (para matchear el más largo).
const SYMBOLS = ['===', '!==', '<>', '==', '!=', '<=', '>=', '&&', '||', '=', '<', '>', '+', '-', '*', '/'];

/** Tokeniza; devuelve null ante un carácter/estado no soportado. */
function tokenize(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
    } else if (c === '(' || c === ')') {
      tokens.push({ type: c });
      i++;
    } else if (c === '"' || c === "'") {
      const quote = c;
      let s = '';
      i++;
      while (i < str.length && str[i] !== quote) {
        s += str[i];
        i++;
      }
      if (i >= str.length) return null; // string sin cerrar
      i++;
      tokens.push({ type: 'val', value: s });
    } else if (/[0-9.]/.test(c)) {
      let n = '';
      while (i < str.length && /[0-9.]/.test(str[i])) {
        n += str[i];
        i++;
      }
      tokens.push({ type: 'val', value: Number(n) });
    } else if (/[A-Za-z_]/.test(c)) {
      let id = '';
      while (i < str.length && /[A-Za-z0-9_]/.test(str[i])) {
        id += str[i];
        i++;
      }
      const low = id.toLowerCase();
      if (low === 'and') tokens.push({ type: 'op', value: '&&' });
      else if (low === 'or') tokens.push({ type: 'op', value: '||' });
      else if (low === 'true') tokens.push({ type: 'val', value: true });
      else if (low === 'false') tokens.push({ type: 'val', value: false });
      else tokens.push({ type: 'id', value: id });
    } else {
      let matched = null;
      for (const sym of SYMBOLS) {
        if (str.startsWith(sym, i)) {
          matched = sym;
          break;
        }
      }
      if (!matched) return null; // carácter no soportado
      tokens.push({ type: 'op', value: matched });
      i += matched.length;
    }
  }
  return tokens;
}

/** Inserta un `0` antes de un `+`/`-` unario (`-a` → `0 - a`). */
function normalizeUnary(tokens) {
  const out = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
      const unary = !prev || prev.type === 'op' || prev.type === '(';
      if (unary) out.push({ type: 'val', value: 0 });
    }
    out.push(t);
  }
  return out;
}

/** Shunting-yard: infija → postfija (RPN). */
function toRPN(tokens) {
  const output = [];
  const ops = [];
  for (const t of tokens) {
    if (t.type === 'val') {
      output.push(t);
    } else if (t.type === 'op') {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.type === 'op' && OPERATORS[top.value].prec >= OPERATORS[t.value].prec) {
          output.push(ops.pop());
        } else {
          break;
        }
      }
      ops.push(t);
    } else if (t.type === '(') {
      ops.push(t);
    } else if (t.type === ')') {
      while (ops.length && ops[ops.length - 1].type !== '(') {
        output.push(ops.pop());
      }
      if (!ops.length) throw new Error('paréntesis desbalanceado');
      ops.pop();
    }
  }
  while (ops.length) {
    const op = ops.pop();
    if (op.type === '(') throw new Error('paréntesis desbalanceado');
    output.push(op);
  }
  return output;
}

/** Evalúa la RPN de valores y operadores binarios. */
function evalRPN(rpn) {
  const stack = [];
  for (const t of rpn) {
    if (t.type === 'val') {
      stack.push(t.value);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('expresión inválida');
      stack.push(OPERATORS[t.value].fn(a, b));
    }
  }
  if (stack.length !== 1) throw new Error('expresión inválida');
  return stack[0];
}

/**
 * Evalúa una condición booleana.
 *
 * @param {string} formula p. ej. `"tipo_requerimiento_id_rao == 2"`.
 * @param {(name: string) => *} getValue resuelve un campo (undefined/null → '').
 * @returns {boolean}
 */
export function evaluateCondition(formula, getValue) {
  if (!formula || typeof formula !== 'string') return false;
  const tokens = tokenize(formula);
  if (!tokens || tokens.length === 0) return false;

  const resolved = tokens.map((t) => {
    if (t.type === 'id') {
      const raw = getValue ? getValue(t.value) : undefined;
      return { type: 'val', value: raw === undefined || raw === null ? '' : raw };
    }
    return t;
  });

  try {
    return truthy(evalRPN(toRPN(normalizeUnary(resolved))));
  } catch (_e) {
    return false;
  }
}
