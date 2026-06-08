import { describe, expect, it } from 'vitest';

import { evaluateFormula } from './formula.js';

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
