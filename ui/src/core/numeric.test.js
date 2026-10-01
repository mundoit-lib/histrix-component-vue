import { describe, expect, it } from 'vitest';

import {
  formatNumber,
  isNumericField,
  numberError,
  numericSpec,
  parseNumber,
  toBackendNumber,
  valueToNumber
} from './numeric.js';

const AR = numericSpec({ histrix_type: 'Decimal' });
const AR_BRACKETS = numericSpec({ histrix_type: 'CustomNumeric', 'data-n-bracket': '(,)' });
const INT = numericSpec({ histrix_type: 'Integer', type: 'number' });

describe('isNumericField', () => {
  it('reconoce todas las clases numéricas de Histrix', () => {
    for (const t of [
      'Numeric',
      'Decimal',
      'CustomNumeric',
      'EnclosedNumeric',
      'EnclosedInteger',
      'Hfloat',
      'Integer'
    ]) {
      expect(isNumericField({ histrix_type: t })).toBe(true);
    }
  });

  it('no marca otros tipos', () => {
    expect(isNumericField({ histrix_type: 'Varchar' })).toBe(false);
    expect(isNumericField(undefined)).toBe(false);
  });
});

describe('numericSpec', () => {
  it('defaults es-AR', () => {
    expect(AR).toEqual({
      decimals: 2,
      decimalSep: ',',
      thousandsSep: '.',
      negativeBrackets: false,
      min: null,
      max: null,
      integer: false
    });
  });

  it('lee los atributos de autoNumeric del schema', () => {
    const spec = numericSpec({
      histrix_type: 'CustomNumeric',
      'data-a-dec': '.',
      'data-a-sep': ',',
      'data-m-dec': '3',
      'data-n-bracket': '(,)',
      'data-v-min': '-100',
      max: '500'
    });
    expect(spec).toMatchObject({
      decimals: 3,
      decimalSep: '.',
      thousandsSep: ',',
      negativeBrackets: true,
      min: -100,
      max: 500
    });
  });

  it('usa `decimales` si no viene data-m-dec', () => {
    expect(numericSpec({ histrix_type: 'Decimal', decimales: '4' }).decimals).toBe(4);
    expect(numericSpec({ histrix_type: 'Decimal', 'data-m-dec': '0' }).decimals).toBe(0);
  });

  it('enteros: 0 decimales', () => {
    expect(INT).toMatchObject({ decimals: 0, integer: true });
    expect(numericSpec({ histrix_type: 'EnclosedInteger' }).integer).toBe(true);
  });

  it('data-a-sep vacío = sin miles; igual al decimal se corrige', () => {
    expect(numericSpec({ histrix_type: 'Decimal', 'data-a-sep': '' }).thousandsSep).toBe('');
    expect(numericSpec({ histrix_type: 'Decimal', 'data-a-sep': ',' }).thousandsSep).toBe('.');
  });

  it('data-n-bracket falso', () => {
    expect(numericSpec({ histrix_type: 'Decimal', 'data-n-bracket': 'false' }).negativeBrackets).toBe(false);
    expect(numericSpec({ histrix_type: 'Decimal', 'data-n-bracket': '' }).negativeBrackets).toBe(false);
  });
});

describe('formatNumber', () => {
  it('1234.5 con 2 decimales', () => {
    expect(formatNumber(1234.5, AR)).toBe('1.234,50');
    expect(formatNumber('1234.5', AR)).toBe('1.234,50');
  });

  it('negativos con y sin paréntesis', () => {
    expect(formatNumber(-10, AR)).toBe('-10,00');
    expect(formatNumber(-10, AR_BRACKETS)).toBe('(10,00)');
    expect(formatNumber('-1234.5', AR_BRACKETS)).toBe('(1.234,50)');
  });

  it('vacío y null no son 0', () => {
    expect(formatNumber('', AR)).toBe('');
    expect(formatNumber(null, AR)).toBe('');
    expect(formatNumber(undefined, AR)).toBe('');
  });

  it('cero y negativo que redondea a cero sin signo', () => {
    expect(formatNumber(0, AR)).toBe('0,00');
    expect(formatNumber(-0.001, AR_BRACKETS)).toBe('0,00');
  });

  it('millones y enteros', () => {
    expect(formatNumber(1234567.891, AR)).toBe('1.234.567,89');
    expect(formatNumber('1234567', INT)).toBe('1.234.567');
  });

  it('sin miles (texto de edición)', () => {
    expect(formatNumber(1234.5, AR, { grouping: false })).toBe('1234,50');
  });

  it('acepta un valor ya formateado', () => {
    expect(formatNumber('1.234,50', AR)).toBe('1.234,50');
  });

  it('deja tal cual lo que no es número', () => {
    expect(formatNumber('abc', AR)).toBe('abc');
  });
});

describe('parseNumber', () => {
  it("'1.234,50' → 1234.5", () => {
    expect(parseNumber('1.234,50', AR)).toBe(1234.5);
  });

  it('coma o punto como decimal', () => {
    expect(parseNumber('1234,5', AR)).toBe(1234.5);
    expect(parseNumber('1234.5', AR)).toBe(1234.5);
    expect(parseNumber('0.5', AR)).toBe(0.5);
  });

  it('punto que agrupa de a 3 es miles', () => {
    expect(parseNumber('1.234', AR)).toBe(1234);
    expect(parseNumber('1.234.567', AR)).toBe(1234567);
  });

  it('signo y paréntesis', () => {
    expect(parseNumber('-10', AR)).toBe(-10);
    expect(parseNumber('(1.234,50)', AR)).toBe(-1234.5);
    expect(parseNumber(' 12 ', AR)).toBe(12);
  });

  it('vacío → null, inválido → NaN', () => {
    expect(parseNumber('', AR)).toBeNull();
    expect(parseNumber('   ', AR)).toBeNull();
    expect(parseNumber(null, AR)).toBeNull();
    expect(parseNumber('12a', AR)).toBeNaN();
    expect(parseNumber('1,2,3', AR)).toBeNaN();
  });

  it('números pasan directo', () => {
    expect(parseNumber(3.5, AR)).toBe(3.5);
  });
});

describe('valueToNumber', () => {
  it('el string del backend es punto decimal', () => {
    expect(valueToNumber('1.5', AR)).toBe(1.5);
    expect(valueToNumber('1234.50', AR)).toBe(1234.5);
  });

  it('formato de display cae a parseNumber', () => {
    expect(valueToNumber('1.234,50', AR)).toBe(1234.5);
  });
});

describe('toBackendNumber', () => {
  it('punto decimal sin miles', () => {
    expect(toBackendNumber('1.234,50', AR)).toBe('1234.5');
    expect(toBackendNumber('-10', AR)).toBe('-10');
  });

  it('vacío queda vacío (no 0)', () => {
    expect(toBackendNumber('', AR)).toBe('');
    expect(toBackendNumber(null, AR)).toBe('');
  });

  it('inválido se deja tal cual', () => {
    expect(toBackendNumber('12a', AR)).toBe('12a');
  });
});

describe('numberError', () => {
  it('vacío es válido', () => {
    expect(numberError('', AR)).toBeNull();
    expect(numberError(null, AR)).toBeNull();
  });

  it('no numérico', () => {
    expect(numberError('abc', AR)).toBe('numeric');
  });

  it('entero no acepta decimales', () => {
    expect(numberError('10', INT)).toBeNull();
    expect(numberError('10.5', INT)).toBe('integer');
  });

  it('más decimales de los permitidos', () => {
    expect(numberError('10.25', AR)).toBeNull();
    expect(numberError('10.255', AR)).toBe('decimals');
  });

  it('min/max', () => {
    const spec = numericSpec({ histrix_type: 'Decimal', min: '0', max: '100' });
    expect(numberError('-1', spec)).toBe('min');
    expect(numberError('101', spec)).toBe('max');
    expect(numberError('50', spec)).toBeNull();
  });
});
