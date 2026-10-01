import { describe, expect, it } from 'vitest';

import { aFecha, evaluateFormula, evaluateValidation, mifloat, parseFormula, straFecha } from './formula.js';

/** Helper: arma un getValue a partir de un objeto plano. */
const vals = (obj) => (k) => obj[k];

describe('evaluateFormula', () => {
  it('multiplica dos campos', () => {
    expect(evaluateFormula('precio * cantidad', vals({ precio: 10, cantidad: 3 }))).toBe(30);
  });

  it('respeta la precedencia de operadores', () => {
    expect(evaluateFormula('a + b * c', vals({ a: 1, b: 2, c: 3 }))).toBe(7);
  });

  it('respeta los paréntesis', () => {
    expect(evaluateFormula('(a + b) * c', vals({ a: 1, b: 2, c: 3 }))).toBe(9);
  });

  it('acepta literales numéricos (p. ej. IVA 1.21)', () => {
    expect(evaluateFormula('precio * 1.21', vals({ precio: 100 }))).toBeCloseTo(121);
  });

  it('coerce strings numéricos del backend', () => {
    expect(evaluateFormula('a + b', vals({ a: '2', b: '3' }))).toBe(5);
  });

  it('trata null como 0 (importes NULL del backend, docs/07 §8.3)', () => {
    expect(evaluateFormula('a + b', vals({ a: null, b: 5 }))).toBe(5);
  });

  it('trata string vacío como 0', () => {
    expect(evaluateFormula('a + b', vals({ a: '', b: 5 }))).toBe(5);
  });

  it('maneja el menos unario', () => {
    expect(evaluateFormula('-a + b', vals({ a: 2, b: 5 }))).toBe(3);
  });

  it('divide', () => {
    expect(evaluateFormula('total / cantidad', vals({ total: 100, cantidad: 4 }))).toBe(25);
  });

  it('devuelve undefined si falta un campo del contexto', () => {
    expect(evaluateFormula('a * b', vals({ a: 2 }))).toBeUndefined();
  });

  it('devuelve undefined con fórmula vacía o no-string', () => {
    expect(evaluateFormula('', vals({}))).toBeUndefined();
    expect(evaluateFormula(null, vals({}))).toBeUndefined();
    expect(evaluateFormula(undefined, vals({}))).toBeUndefined();
  });

  it('devuelve undefined con sintaxis inválida', () => {
    expect(evaluateFormula('a * * b', vals({ a: 1, b: 2 }))).toBeUndefined();
    expect(evaluateFormula('(a + b', vals({ a: 1, b: 2 }))).toBeUndefined();
    expect(evaluateFormula('a + b)', vals({ a: 1, b: 2 }))).toBeUndefined();
  });

  it('es seguro: no ejecuta código arbitrario (sin eval)', () => {
    // Un identificador como "alert" se trata como campo; sin valor → undefined.
    expect(evaluateFormula('alert', vals({}))).toBeUndefined();
    // Tokens no aritméticos (`;`) invalidan la fórmula.
    expect(evaluateFormula('a; b', vals({ a: 1, b: 2 }))).toBeUndefined();
  });
});

// Casos sacados de <jseval> reales del backend (ui/dev/scripts/jseval-coverage.mjs).
describe('evaluateFormula: jseval reales', () => {
  it('toFixed sobre una expresión (aceptación)', () => {
    expect(evaluateFormula('(precio * cantidad).toFixed(2)', vals({ precio: 10.005, cantidad: 3 }))).toBe('30.02');
  });

  it('ternario con fecha vacía (aceptación)', () => {
    const f = "fecha != '' ? aFecha(fecha) : ''";
    expect(evaluateFormula(f, vals({ fecha: '' }))).toBe('');
    expect(evaluateFormula(f, vals({ fecha: '15/03/2025' }))).toBe(Date.UTC(2025, 2, 15));
  });

  it('saldo con toFixed', () => {
    const v = vals({ saldo_movimiento: '100.5', imputado: 20 });
    expect(evaluateFormula('(saldo_movimiento + imputado).toFixed(2)', v)).toBe('120.50');
  });

  it('ternario con Math.abs y toFixed comparado', () => {
    const f = ' ( (Math.abs(saldo_movimiento) - imputado).toFixed(2) < 0) ? 1 : 0 ';
    expect(evaluateFormula(f, vals({ saldo_movimiento: -50, imputado: 80 }))).toBe(1);
    expect(evaluateFormula(f, vals({ saldo_movimiento: -50, imputado: 20 }))).toBe(0);
  });

  it('ternario por letra de comprobante', () => {
    const f = "(letra == 'C') ? importe : 0";
    expect(evaluateFormula(f, vals({ letra: 'C', importe: 121 }))).toBe(121);
    expect(evaluateFormula(f, vals({ letra: 'A', importe: 121 }))).toBe(0);
  });

  it('ternarios anidados', () => {
    const f = '( dto != 0 && desc1 == 0) ? ( dto_cant <= cant ? dto : 0 ) : desc1';
    expect(evaluateFormula(f, vals({ dto: 10, desc1: 0, dto_cant: 2, cant: 5 }))).toBe(10);
    expect(evaluateFormula(f, vals({ dto: 10, desc1: 0, dto_cant: 9, cant: 5 }))).toBe(0);
    expect(evaluateFormula(f, vals({ dto: 10, desc1: 7, dto_cant: 2, cant: 5 }))).toBe(7);
  });

  it('ternario con toFixed sobre el resultado', () => {
    const f = "(imputacion == '0' ? 0 : neto).toFixed(2)";
    expect(evaluateFormula(f, vals({ imputacion: '0', neto: 50 }))).toBe('0.00');
    expect(evaluateFormula(f, vals({ imputacion: 3, neto: 50 }))).toBe('50.00');
  });

  it('el ternario es asociativo a derecha', () => {
    expect(evaluateFormula('a == 1 ? 10 : a == 2 ? 20 : 30', vals({ a: 2 }))).toBe(20);
    expect(evaluateFormula('a == 1 ? 10 : a == 2 ? 20 : 30', vals({ a: 9 }))).toBe(30);
  });

  it('Math.round con el truco de EPSILON', () => {
    const f = 'Math.round((neto * 1.21 + Number.EPSILON) * 100) / 100';
    expect(evaluateFormula(f, vals({ neto: 1.005 }))).toBe(1.22);
  });

  it('Math.ceil, floor, min, max, pow y trunc', () => {
    const v = vals({ a: 2.4, b: -2.6 });
    expect(evaluateFormula('Math.ceil(a)', v)).toBe(3);
    expect(evaluateFormula('Math.floor(a)', v)).toBe(2);
    expect(evaluateFormula('Math.min(a, b, 0)', v)).toBe(-2.6);
    expect(evaluateFormula('Math.max(a, b)', v)).toBe(2.4);
    expect(evaluateFormula('Math.pow(2, 10)', v)).toBe(1024);
    expect(evaluateFormula('Math.trunc(b)', v)).toBe(-2);
  });

  it('parseInt y parseFloat', () => {
    expect(evaluateFormula('parseInt(cuotas) + 1', vals({ cuotas: '3' }))).toBe(4);
    expect(evaluateFormula("parseInt('08', 10)", vals({}))).toBe(8);
    expect(evaluateFormula('parseFloat(tasa) / 100', vals({ tasa: '21.5' }))).toBe(0.215);
  });

  it('Number y String', () => {
    expect(evaluateFormula('Number(a) + Number(b)', vals({ a: '2', b: '3' }))).toBe(5);
    expect(evaluateFormula("String(nro) + '-' + letra", vals({ nro: 12, letra: 'A' }))).toBe('12-A');
  });

  it('substring sobre un campo string', () => {
    expect(evaluateFormula('cuit.substring(0, 2)', vals({ cuit: '20-12345678-9' }))).toBe('20');
  });

  it('substr, slice, trim, toUpperCase, toLowerCase e indexOf', () => {
    const v = vals({ s: '  Hola Mundo ' });
    expect(evaluateFormula('s.trim().substr(0, 4)', v)).toBe('Hola');
    expect(evaluateFormula('s.trim().slice(-5)', v)).toBe('Mundo');
    expect(evaluateFormula('s.toUpperCase().trim()', v)).toBe('HOLA MUNDO');
    expect(evaluateFormula('s.toLowerCase().indexOf("mundo")', v)).toBe(7);
  });

  it('length', () => {
    expect(evaluateFormula('codigo.length', vals({ codigo: 'ABC-1' }))).toBe(5);
    expect(evaluateFormula('codigo.length > 3 ? 1 : 0', vals({ codigo: 'AB' }))).toBe(0);
  });

  it('Date.parse armando un ISO con substring', () => {
    const f = "Date.parse(f.substring(6,10) + '-' + f.substring(3,5) + '-' + f.substring(0,2)) < Date.parse(hasta)";
    expect(evaluateFormula(f, vals({ f: '01/02/2025', hasta: '2025-03-01' }))).toBe(true);
    expect(evaluateFormula(f, vals({ f: '01/04/2025', hasta: '2025-03-01' }))).toBe(false);
  });

  it('aFecha compara y resta fechas como el legacy', () => {
    const v = vals({ desde: '01/03/2025', hasta: '11/03/2025' });
    expect(evaluateFormula('aFecha(hasta) > aFecha(desde)', v)).toBe(true);
    expect(evaluateFormula('(aFecha(hasta) - aFecha(desde)) / 86400000', v)).toBe(10);
  });

  it('straFecha acepta ISO y dd/mm/yyyy', () => {
    expect(evaluateFormula('straFecha(a) == straFecha(b)', vals({ a: '2025-03-15', b: '15/03/2025' }))).toBe(true);
    expect(evaluateFormula("straFecha('2025-03-15')", vals({}))).toBe(Date.UTC(2025, 2, 15));
  });

  it('mifloat tolera formatos locales y vacíos', () => {
    expect(evaluateFormula('mifloat(a) + mifloat(b)', vals({ a: '1.234,5', b: null }))).toBe(1234.5);
    expect(evaluateFormula("mifloat('1,234.5')", vals({}))).toBe(1234.5);
    expect(evaluateFormula("mifloat('abc')", vals({}))).toBe(0);
  });

  it('normaliza importes con formato local del backend', () => {
    expect(evaluateFormula('importe * 2', vals({ importe: '1.234,50' }))).toBe(2469);
  });

  it('concatena strings como JS', () => {
    const f = "'Impresion Libro de IVA ' + ((sub == 1) ? 'Ventas' : 'Compras')";
    expect(evaluateFormula(f, vals({ sub: 1 }))).toBe('Impresion Libro de IVA Ventas');
    expect(evaluateFormula(f, vals({ sub: 2 }))).toBe('Impresion Libro de IVA Compras');
  });

  it('comparaciones y lógicos devuelven booleanos', () => {
    const v = vals({ a: 5, b: 3 });
    expect(evaluateFormula('a > b && b >= 3', v)).toBe(true);
    expect(evaluateFormula('a < b || b <= 2', v)).toBe(false);
    expect(evaluateFormula('!(a == 5)', v)).toBe(false);
    expect(evaluateFormula('a !== 5', v)).toBe(false);
  });

  it('igualdad laxa como JS: campo vacío == 0', () => {
    expect(evaluateFormula('a == 0 ? 1 : 2', vals({ a: '' }))).toBe(1);
    expect(evaluateFormula("a == '5' ? 1 : 2", vals({ a: 5 }))).toBe(1);
  });

  it('&& y || devuelven el operando, con cortocircuito', () => {
    expect(evaluateFormula('descuento || 10', vals({ descuento: 0 }))).toBe(10);
    // `falta` no existe, pero no se evalúa
    expect(evaluateFormula('0 && falta', vals({}))).toBe(0);
    expect(evaluateFormula('a ? 1 : falta', vals({ a: 1 }))).toBe(1);
  });

  it('módulo', () => {
    expect(evaluateFormula('nro % 2 == 0 ? 1 : 0', vals({ nro: 14 }))).toBe(1);
  });

  it('literales true, false y escapes en strings', () => {
    expect(evaluateFormula('true ? 1 : 0', vals({}))).toBe(1);
    expect(evaluateFormula("'it\\'s'", vals({}))).toBe("it's");
  });

  it('tolera el ; final del legacy', () => {
    expect(evaluateFormula('a * 2;', vals({ a: 4 }))).toBe(8);
  });

  it('menos unario sobre una llamada', () => {
    expect(evaluateFormula('-Math.abs(a)', vals({ a: -3 }))).toBe(-3);
  });

  it('total simple de un campo', () => {
    expect(evaluateFormula('imputado', vals({ imputado: '12.5' }))).toBe(12.5);
  });
});

describe('evaluateFormula: whitelist y seguridad', () => {
  it('funciones fuera de la whitelist devuelven undefined sin lanzar', () => {
    expect(evaluateFormula('alert(1)', vals({}))).toBeUndefined();
    expect(evaluateFormula('Math.random()', vals({}))).toBeUndefined();
    expect(evaluateFormula("$('#x').val()", vals({}))).toBeUndefined();
    expect(evaluateFormula('a.constructor', vals({ a: 1 }))).toBeUndefined();
    expect(evaluateFormula('a.__proto__', vals({ a: 1 }))).toBeUndefined();
    expect(evaluateFormula("a['constructor']", vals({ a: 1 }))).toBeUndefined();
  });

  it('no acepta sentencias ni asignaciones', () => {
    expect(evaluateFormula('var x = 1', vals({}))).toBeUndefined();
    expect(evaluateFormula('a = 2', vals({ a: 1 }))).toBeUndefined();
    expect(evaluateFormula('if (a) 1', vals({ a: 1 }))).toBeUndefined();
  });

  it('nombres reservados no son campos', () => {
    expect(evaluateFormula('Math', vals({ Math: 1 }))).toBeUndefined();
    expect(evaluateFormula('parseInt + 1', vals({ parseInt: 1 }))).toBeUndefined();
  });

  it('errores en tiempo de evaluación devuelven undefined', () => {
    expect(evaluateFormula('a.toFixed(200)', vals({ a: 1 }))).toBeUndefined();
    expect(evaluateFormula("'abc' * 2", vals({}))).toBeUndefined();
  });

  it('ternario incompleto es sintaxis inválida', () => {
    expect(evaluateFormula('a ? 1', vals({ a: 1 }))).toBeUndefined();
    expect(evaluateFormula('a ? 1 : ', vals({ a: 1 }))).toBeUndefined();
  });
});

describe('evaluateFormula: opciones', () => {
  it('row.campo y parent.campo si el call-site los provee', () => {
    const opts = { row: { cantidad: '2' }, parent: { cotizacion: 1000 } };
    expect(evaluateFormula('row.cantidad * parent.cotizacion', vals({}), opts)).toBe(2000);
  });

  it('row/parent sin contexto o campo inexistente → undefined', () => {
    expect(evaluateFormula('row.cantidad * 2', vals({}))).toBeUndefined();
    expect(evaluateFormula('parent.x', vals({}), { parent: {} })).toBeUndefined();
  });

  it('round: 2 redondea sólo si se pide', () => {
    expect(evaluateFormula('a / 3', vals({ a: 10 }))).toBeCloseTo(3.3333333);
    expect(evaluateFormula('a / 3', vals({ a: 10 }), { round: 2 })).toBe(3.33);
    expect(evaluateFormula('a * 1.005', vals({ a: 1 }), { round: 2 })).toBe(1.01);
  });
});

describe('parseFormula', () => {
  it('devuelve un árbol o null', () => {
    expect(parseFormula('(a + b).toFixed(2)')).not.toBeNull();
    expect(parseFormula('a +')).toBeNull();
    expect(parseFormula('eval("1")')).toBeNull();
    expect(parseFormula('')).toBeNull();
  });
});

describe('evaluateValidation (__EVAL)', () => {
  it('es inválida si el resultado == false', () => {
    expect(evaluateValidation('cantidad > 0', vals({ cantidad: 0 }))).toBe(false);
    expect(evaluateValidation('cantidad > 0', vals({ cantidad: 3 }))).toBe(true);
    expect(evaluateValidation('saldo', vals({ saldo: '' }))).toBe(false);
  });

  it('una fórmula no evaluable no bloquea', () => {
    expect(evaluateValidation('$(x).val() > 0', vals({}))).toBe(true);
    expect(evaluateValidation('falta > 0', vals({}))).toBe(true);
  });
});

describe('helpers de fecha y número', () => {
  it('aFecha', () => {
    expect(aFecha('05/01/2025')).toBe(Date.UTC(2025, 0, 5));
    expect(aFecha('2025-01-05')).toBeNaN();
    expect(aFecha(null)).toBeNaN();
  });

  it('straFecha', () => {
    expect(straFecha('2025-01-05 10:00:00')).toBe(Date.UTC(2025, 0, 5));
    expect(straFecha('05/01/2025')).toBe(Date.UTC(2025, 0, 5));
    expect(straFecha('x')).toBeNaN();
  });

  it('mifloat', () => {
    expect(mifloat(null)).toBe(0);
    expect(mifloat('12,5')).toBe(12.5);
    expect(mifloat(7)).toBe(7);
  });
});
