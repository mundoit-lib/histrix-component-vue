import { describe, expect, it } from 'vitest';
import { evaluateCondition } from './condition.js';

const ctx = (obj) => (k) => obj[k];

describe('evaluateCondition', () => {
  it('igualdad numérica con coerción (string vs number)', () => {
    expect(evaluateCondition('tipo_requerimiento_id_rao == 2', ctx({ tipo_requerimiento_id_rao: '2' }))).toBe(true);
    expect(evaluateCondition('tipo_requerimiento_id_rao == 2', ctx({ tipo_requerimiento_id_rao: '3' }))).toBe(false);
    expect(evaluateCondition('urgente_rao   ==   1', ctx({ urgente_rao: 1 }))).toBe(true);
  });

  it('soporta = como igualdad y != / <>', () => {
    expect(evaluateCondition("estado = 'A'", ctx({ estado: 'A' }))).toBe(true);
    expect(evaluateCondition('x != 2', ctx({ x: 3 }))).toBe(true);
    expect(evaluateCondition('x <> 2', ctx({ x: 2 }))).toBe(false);
  });

  it('comparaciones numéricas', () => {
    expect(evaluateCondition('cantidad >= 5', ctx({ cantidad: '5' }))).toBe(true);
    expect(evaluateCondition('cantidad > 5', ctx({ cantidad: 5 }))).toBe(false);
    expect(evaluateCondition('cantidad < 10', ctx({ cantidad: 9 }))).toBe(true);
  });

  it('lógicos && || and or con precedencia y paréntesis', () => {
    expect(evaluateCondition('a == 1 && b == 2', ctx({ a: 1, b: 2 }))).toBe(true);
    expect(evaluateCondition('a == 1 && b == 2', ctx({ a: 1, b: 9 }))).toBe(false);
    expect(evaluateCondition('a == 1 or b == 2', ctx({ a: 0, b: 2 }))).toBe(true);
    expect(evaluateCondition('(a == 1 || a == 2) && b == 3', ctx({ a: 2, b: 3 }))).toBe(true);
  });

  it('campo faltante se trata como vacío (condición falsa, no rompe)', () => {
    expect(evaluateCondition('tipo == 2', ctx({}))).toBe(false);
    expect(evaluateCondition('tipo == 2', () => undefined)).toBe(false);
  });

  it('comparación de strings', () => {
    expect(evaluateCondition("nombre == 'RENOVA'", ctx({ nombre: 'RENOVA' }))).toBe(true);
    expect(evaluateCondition("nombre != 'RENOVA'", ctx({ nombre: 'OTRO' }))).toBe(true);
  });

  it('devuelve false ante fórmula inválida o vacía', () => {
    expect(evaluateCondition('', ctx({}))).toBe(false);
    expect(evaluateCondition(null, ctx({}))).toBe(false);
    expect(evaluateCondition('a == ', ctx({ a: 1 }))).toBe(false);
    expect(evaluateCondition('a @ b', ctx({ a: 1, b: 2 }))).toBe(false);
  });
});
