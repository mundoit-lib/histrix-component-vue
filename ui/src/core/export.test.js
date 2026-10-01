import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DELIMITER,
  EXPORT_FORMATS,
  buildExportFileName,
  buildExportParams,
  buildExportUrl,
  findFormat,
  formatHasDelimiter,
  getFormatExtension,
  parseQueryString,
  sanitizeFileName
} from './export.js';

describe('EXPORT_FORMATS', () => {
  it('expone los cuatro formatos en orden', () => {
    expect(EXPORT_FORMATS.map((f) => f.format)).toEqual(['xls', 'pdf', 'csv', 'xml']);
  });

  it('solo CSV admite delimitador', () => {
    const conDelimitador = EXPORT_FORMATS.filter((f) => f.hasDelimiter).map((f) => f.format);
    expect(conDelimitador).toEqual(['csv']);
  });
});

describe('getFormatExtension', () => {
  it('mapea cada formato a su extensión', () => {
    expect(getFormatExtension('xls')).toBe('xls');
    expect(getFormatExtension('pdf')).toBe('pdf');
    expect(getFormatExtension('csv')).toBe('csv');
    expect(getFormatExtension('xml')).toBe('xml');
  });

  it('cae al propio valor si el formato es desconocido', () => {
    expect(getFormatExtension('json')).toBe('json');
  });

  it('devuelve string vacío con formato indefinido', () => {
    expect(getFormatExtension(undefined)).toBe('');
  });
});

describe('findFormat / formatHasDelimiter', () => {
  it('encuentra la definición del formato', () => {
    expect(findFormat('csv')?.name).toBe('CSV');
  });

  it('devuelve undefined para un formato inexistente', () => {
    expect(findFormat('zip')).toBeUndefined();
  });

  it('marca CSV como formato con delimitador', () => {
    expect(formatHasDelimiter('csv')).toBe(true);
  });

  it('los demás formatos no tienen delimitador', () => {
    expect(formatHasDelimiter('xls')).toBe(false);
    expect(formatHasDelimiter('pdf')).toBe(false);
    expect(formatHasDelimiter('xml')).toBe(false);
    expect(formatHasDelimiter('desconocido')).toBe(false);
  });
});

describe('sanitizeFileName', () => {
  it('quita caracteres inválidos para nombre de archivo', () => {
    expect(sanitizeFileName('Ventas/2024:enero*')).toBe('Ventas2024enero');
  });

  it('colapsa espacios y recorta extremos', () => {
    expect(sanitizeFileName('  Lista   de   precios  ')).toBe('Lista de precios');
  });

  it('preserva acentos y caracteres válidos', () => {
    expect(sanitizeFileName('Facturación años')).toBe('Facturación años');
  });

  it('devuelve string vacío con null/undefined', () => {
    expect(sanitizeFileName(null)).toBe('');
    expect(sanitizeFileName(undefined)).toBe('');
  });
});

describe('buildExportFileName', () => {
  it('arma nombre con la extensión del formato', () => {
    expect(buildExportFileName('Localidades', 'xls')).toBe('Localidades.xls');
    expect(buildExportFileName('Localidades', 'csv')).toBe('Localidades.csv');
  });

  it('sanea el título antes de componer el nombre', () => {
    expect(buildExportFileName('Reporte/Mensual', 'pdf')).toBe('ReporteMensual.pdf');
  });

  it('usa "export" como fallback si el título queda vacío', () => {
    expect(buildExportFileName('', 'xml')).toBe('export.xml');
    expect(buildExportFileName('///', 'xml')).toBe('export.xml');
  });
});

describe('parseQueryString', () => {
  it('devuelve objeto vacío con querystring vacía o nula', () => {
    expect(parseQueryString('')).toEqual({});
    expect(parseQueryString(null)).toEqual({});
    expect(parseQueryString(undefined)).toEqual({});
  });

  it('desnuda el sufijo [] y acumula valores en array', () => {
    expect(parseQueryString('_f[]=nombre&_o[]=like&_v[]=juan')).toEqual({
      _f: ['nombre'],
      _o: ['like'],
      _v: ['juan']
    });
  });

  it('agrupa claves repetidas en el mismo array, en orden', () => {
    expect(parseQueryString('_f[]=a&_f[]=b&_v[]=1&_v[]=2')).toEqual({
      _f: ['a', 'b'],
      _v: ['1', '2']
    });
  });

  it('soporta el & inicial que produce buildFilterQuery', () => {
    expect(parseQueryString('&_f[]=edad&_o[]=gt&_v[]=18')).toEqual({
      _f: ['edad'],
      _o: ['gt'],
      _v: ['18']
    });
  });
});

describe('buildExportParams', () => {
  it('devuelve objeto vacío sin argumentos', () => {
    expect(buildExportParams()).toEqual({});
  });

  it('mergea query base con los filtros parseados de exportQuery', () => {
    expect(
      buildExportParams({
        query: { tenant: '7' },
        exportQuery: '&_f[]=provincia&_o[]=eq&_v[]=BA',
        format: 'xls'
      })
    ).toEqual({
      tenant: '7',
      _f: ['provincia'],
      _o: ['eq'],
      _v: ['BA']
    });
  });

  it('agrega el delimitador solo para CSV', () => {
    expect(buildExportParams({ format: 'csv', delimiter: ';' })._delimiter).toBe(';');
    expect(buildExportParams({ format: 'xls', delimiter: ';' })._delimiter).toBeUndefined();
  });

  it('usa la coma como delimitador por defecto en CSV', () => {
    expect(buildExportParams({ format: 'csv' })._delimiter).toBe(DEFAULT_DELIMITER);
  });

  it('no agrega delimitador vacío aunque el formato sea CSV', () => {
    expect(buildExportParams({ format: 'csv', delimiter: '' })._delimiter).toBeUndefined();
  });

  it('los filtros de exportQuery pisan a query ante claves repetidas', () => {
    expect(buildExportParams({ query: { _v: ['viejo'] }, exportQuery: '_v[]=nuevo' })._v).toEqual(['nuevo']);
  });
});

describe('buildExportUrl', () => {
  it('compone la URL de descarga del backend', () => {
    expect(buildExportUrl('https://host/api/db/midb', 'csv', 'general/localidades_crud.xml')).toBe(
      'https://host/api/db/midb/export/csv/general/localidades_crud.xml'
    );
  });
});
