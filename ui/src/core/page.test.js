import { describe, expect, it } from 'vitest';
import { dialogWidthStyle, resolvePagePath } from './page.js';

describe('resolvePagePath', () => {
  it('acepta string o segmentos del router y limpia barras', () => {
    expect(resolvePagePath('ventas/qry/listado.xml')).toBe('ventas/qry/listado.xml');
    expect(resolvePagePath(['ventas', 'qry', 'listado.xml'])).toBe('ventas/qry/listado.xml');
    expect(resolvePagePath('//ventas//abm.xml')).toBe('ventas/abm.xml');
    expect(resolvePagePath(undefined)).toBe('');
  });
});

describe('dialogWidthStyle', () => {
  it('número en px, string tal cual, vacío sin estilo', () => {
    expect(dialogWidthStyle(800)).toEqual({ width: '800px', maxWidth: '95vw' });
    expect(dialogWidthStyle('80vw')).toEqual({ width: '80vw', maxWidth: '95vw' });
    expect(dialogWidthStyle('')).toEqual({});
    expect(dialogWidthStyle(null)).toEqual({});
  });
});
