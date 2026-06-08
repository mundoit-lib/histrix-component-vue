/**
 * Evaluador de fórmulas aritméticas de Histrix (`computed_fields` / `jseval`).
 *
 * Reemplaza el `eval()` que vivía DUPLICADO en HistrixForm y HistrixTable por
 * un tokenizer + shunting-yard acotado a aritmética (`+ - * /` y paréntesis).
 * No ejecuta código arbitrario: cualquier token fuera de números, nombres de
 * campo y esos operadores invalida la fórmula (devuelve `undefined`), igual que
 * el `try/catch` anterior.
 *
 * Histrix solo soportó siempre aritmética pura en estas fórmulas (ver
 * `docs/07-backend-histrix.md` §9): `toFixed`, `parseInt`, condicionales, etc.
 * nunca anduvieron, así que no se pierde capacidad — sí se gana seguridad.
 *
 * Identificadores soportados: nombres de campo SQL `[A-Za-z_][A-Za-z0-9_]*`.
 */

const OPERATORS = {
  '+': { prec: 1, fn: (a, b) => a + b },
  '-': { prec: 1, fn: (a, b) => a - b },
  '*': { prec: 2, fn: (a, b) => a * b },
  '/': { prec: 2, fn: (a, b) => a / b }
};

/** Tokeniza la fórmula. Devuelve `null` si encuentra un carácter no soportado. */
function tokenize(formula) {
  const tokens = [];
  let i = 0;
  while (i < formula.length) {
    const c = formula[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
    } else if (c === '(' || c === ')') {
      tokens.push({ type: c });
      i++;
    } else if (c in OPERATORS) {
      tokens.push({ type: 'op', value: c });
      i++;
    } else if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: 'num', value: Number(num) });
    } else if (/[A-Za-z_]/.test(c)) {
      let id = '';
      while (i < formula.length && /[A-Za-z0-9_]/.test(formula[i])) {
        id += formula[i];
        i++;
      }
      tokens.push({ type: 'id', value: id });
    } else {
      return null; // carácter no soportado → fórmula inválida
    }
  }
  return tokens;
}

/** Inserta un `0` antes de un `+`/`-` unario, para tratar `-a` como `0 - a`. */
function normalizeUnary(tokens) {
  const out = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
      const unary = !prev || prev.type === 'op' || prev.type === '(';
      if (unary) out.push({ type: 'num', value: 0 });
    }
    out.push(t);
  }
  return out;
}

/** Shunting-yard: tokens en notación infija → postfija (RPN). */
function toRPN(tokens) {
  const output = [];
  const ops = [];
  for (const t of tokens) {
    if (t.type === 'num') {
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

/** Evalúa una expresión en RPN de números y operadores binarios. */
function evalRPN(rpn) {
  const stack = [];
  for (const t of rpn) {
    if (t.type === 'num') {
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
 * Evalúa una fórmula reemplazando los nombres de campo por sus valores.
 *
 * @param {string} formula - p. ej. `"precio * cantidad * 1.21"`.
 * @param {(name: string) => *} getValue - resuelve el valor de un campo.
 *   Coerción numérica defensiva (patrón de la casa para importes `NULL`):
 *   `null`/`''` → 0, `'5'` → 5. Si devuelve `undefined`, la fórmula no es
 *   evaluable (el campo no existe en el contexto).
 * @returns {number|undefined} el resultado, o `undefined` si la fórmula está
 *   vacía, falta un campo, hay un token inválido o la sintaxis es incorrecta.
 */
export function evaluateFormula(formula, getValue) {
  if (!formula || typeof formula !== 'string') return undefined;

  const tokens = tokenize(formula);
  if (!tokens || tokens.length === 0) return undefined;

  const resolved = [];
  for (const t of tokens) {
    if (t.type === 'id') {
      const raw = getValue ? getValue(t.value) : undefined;
      if (raw === undefined) return undefined; // campo sin valor → no evaluable
      const n = Number(raw); // null→0, ''→0, '5'→5
      if (Number.isNaN(n)) return undefined;
      resolved.push({ type: 'num', value: n });
    } else if (t.type === 'num') {
      if (Number.isNaN(t.value)) return undefined; // p. ej. "1.2.3"
      resolved.push(t);
    } else {
      resolved.push(t);
    }
  }

  try {
    return evalRPN(toRPN(normalizeUnary(resolved)));
  } catch (_e) {
    return undefined; // sintaxis inválida (mismo comportamiento que el eval+catch viejo)
  }
}
