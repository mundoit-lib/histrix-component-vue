import { describe, expect, it } from 'vitest';
import { HistrixApiError, NETWORK_MESSAGE, kindFromStatus, normalizeApiError, stripHtml } from './apiError.js';

const axiosError = (status, data, headers = {}) => ({
  message: `Request failed with status code ${status}`,
  request: {},
  response: { status, data, headers }
});

describe('stripHtml', () => {
  it('saca tags, entidades y colapsa espacios', () => {
    expect(stripHtml('<p>Campo   obligatorio:&nbsp;<b>Nombre</b></p>')).toBe('Campo obligatorio: Nombre');
    expect(stripHtml('a<br/>b &amp; c &#233;')).toBe('a b & c é');
  });

  it('descarta head/script/style', () => {
    expect(stripHtml('<html><head><title>X</title><style>p{}</style></head><body><h1>Oops!</h1></body></html>')).toBe(
      'Oops!'
    );
  });

  it('tolera null/undefined', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
  });
});

describe('kindFromStatus', () => {
  it('mapea los status del backend', () => {
    expect(kindFromStatus(400)).toBe('validation');
    expect(kindFromStatus(422)).toBe('validation');
    expect(kindFromStatus(401)).toBe('auth');
    expect(kindFromStatus(403)).toBe('auth');
    expect(kindFromStatus(404)).toBe('not_found');
    expect(kindFromStatus(500)).toBe('server');
    expect(kindFromStatus(503)).toBe('server');
    expect(kindFromStatus(409)).toBe('unknown');
    expect(kindFromStatus(0)).toBe('unknown');
  });
});

describe('normalizeApiError', () => {
  it('400 text/html → validation con mensaje sin <p>', () => {
    const err = normalizeApiError(axiosError(400, '<p>Campo obligatorio: Nombre</p>', { 'content-type': 'text/html' }));
    expect(err).toBeInstanceOf(HistrixApiError);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.kind).toBe('validation');
    expect(err.message).toBe('Campo obligatorio: Nombre');
  });

  it('400 text/plain', () => {
    const err = normalizeApiError(axiosError(400, 'El código ya existe'));
    expect(err.kind).toBe('validation');
    expect(err.message).toBe('El código ya existe');
  });

  it('400 JSON usa message|error|description|responseText', () => {
    expect(normalizeApiError(axiosError(400, { message: 'm' })).message).toBe('m');
    expect(normalizeApiError(axiosError(400, { responseText: '<p>rt</p>' })).message).toBe('rt');
    expect(normalizeApiError(axiosError(400, '{"error":"desde string"}')).message).toBe('desde string');
  });

  it('401 JSON {error, description}', () => {
    const err = normalizeApiError(axiosError(401, { error: 'invalid_grant', description: 'Token expirado' }));
    expect(err.kind).toBe('auth');
    expect(err.status).toBe(401);
    expect(err.message).toBe('invalid_grant');
  });

  it('401 con error vacío cae a description', () => {
    expect(normalizeApiError(axiosError(401, { error: '', description: 'Token expirado' })).message).toBe(
      'Token expirado'
    );
  });

  it('404 sin body → mensaje por defecto', () => {
    const err = normalizeApiError(axiosError(404, ''));
    expect(err.kind).toBe('not_found');
    expect(err.message).toBe('El recurso solicitado no existe o expiró');
  });

  it('500 text/html "Oops!"', () => {
    const html =
      '<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Oops!</h1><p>Algo salió mal</p></body></html>';
    const err = normalizeApiError(axiosError(500, html));
    expect(err.kind).toBe('server');
    expect(err.message).toBe('Oops! Algo salió mal');
  });

  it('error de red sin response', () => {
    const err = normalizeApiError({ message: 'Network Error', code: 'ERR_NETWORK', request: {} });
    expect(err.kind).toBe('network');
    expect(err.status).toBe(0);
    expect(err.message).toBe(NETWORK_MESSAGE);
  });

  it('error genérico (no axios) → unknown con su mensaje', () => {
    const err = normalizeApiError(new TypeError('x is undefined'));
    expect(err.kind).toBe('unknown');
    expect(err.message).toBe('x is undefined');
  });

  it('conserva raw y response para compatibilidad', () => {
    const original = axiosError(400, 'bad');
    const err = normalizeApiError(original);
    expect(err.raw).toBe(original);
    expect(err.response.data).toBe('bad');
  });

  it('es idempotente', () => {
    const err = normalizeApiError(axiosError(400, 'bad'));
    expect(normalizeApiError(err)).toBe(err);
  });
});
