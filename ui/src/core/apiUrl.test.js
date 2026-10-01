import { describe, expect, it } from 'vitest';
import { buildApiUrl, hostFromApiUrl, resolveHost } from './apiUrl.js';

describe('hostFromApiUrl', () => {
  it('devuelve el host pelado tal cual (sin barra final)', () => {
    expect(hostFromApiUrl('https://erp.ejemplo.com/')).toBe('https://erp.ejemplo.com');
  });

  it('corta la URL completa de una base', () => {
    expect(hostFromApiUrl('https://erp.ejemplo.com/api/db/demo')).toBe('https://erp.ejemplo.com');
    expect(hostFromApiUrl('https://erp.ejemplo.com/sub/api')).toBe('https://erp.ejemplo.com/sub');
  });

  it('vacío si no hay URL', () => {
    expect(hostFromApiUrl('')).toBe('');
    expect(hostFromApiUrl(undefined)).toBe('');
  });
});

describe('resolveHost', () => {
  it('prioriza el host guardado', () => {
    expect(resolveHost({ storedHost: 'https://a.com/', fixApi: 'https://b.com', apiUrl: 'https://c.com' })).toBe(
      'https://a.com'
    );
  });

  it('respeta fixApi (compat) antes que apiUrl', () => {
    expect(resolveHost({ fixApi: 'https://b.com', apiUrl: 'https://c.com' })).toBe('https://b.com');
  });

  it('deriva de apiUrl si no hay otra cosa', () => {
    expect(resolveHost({ apiUrl: 'https://c.com/api/db/x' })).toBe('https://c.com');
  });
});

describe('buildApiUrl', () => {
  it('arma la URL de la base', () => {
    expect(buildApiUrl({ host: 'https://a.com/', db: 'demo' })).toBe('https://a.com/api/db/demo');
  });

  it('sin base usa apiUrl', () => {
    expect(buildApiUrl({ host: 'https://a.com', db: '', apiUrl: 'https://a.com/api/db/x/' })).toBe(
      'https://a.com/api/db/x'
    );
  });
});
