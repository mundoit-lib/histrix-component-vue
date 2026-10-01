// Normalización de errores del backend Histrix. Puro (sin Vue/Quasar/DOM) para
// poder testearlo en Node. El backend responde con formatos muy distintos:
// 400 text/plain|text/html (`<p>Campo obligatorio…</p>`), 401 JSON
// `{error, description}`, 404 (XML inexistente o instancia expirada), 500
// text/html "Oops!" y errores de red sin `response`.

export const NETWORK_MESSAGE = 'Sin conexión con el servidor';

const DEFAULT_MESSAGES = {
  validation: 'Los datos enviados no son válidos',
  auth: 'Sesión expirada o sin permisos',
  not_found: 'El recurso solicitado no existe o expiró',
  server: 'Error interno del servidor',
  network: NETWORK_MESSAGE,
  unknown: 'Ocurrió un error inesperado'
};

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'"
};

export class HistrixApiError extends Error {
  constructor({ status = 0, kind = 'unknown', message = '', raw = null } = {}) {
    super(message || DEFAULT_MESSAGES[kind] || DEFAULT_MESSAGES.unknown);
    this.name = 'HistrixApiError';
    this.status = status;
    this.kind = kind;
    this.raw = raw;
    // Compatibilidad: los `catch` existentes leen `e.response.data`.
    this.response = raw?.response;
  }
}

export function kindFromStatus(status) {
  if (!status) return 'unknown';
  if (status === 400 || status === 422) return 'validation';
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'server';
  return 'unknown';
}

// Texto plano a partir de HTML, con regex (sin DOMParser).
export function stripHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/<(script|style|head|title)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

const toText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return stripHtml(value);
  return '';
};

// Mensaje legible a partir del body de la respuesta (string, JSON u otro).
export function messageFromData(data) {
  if (data == null) return '';
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return messageFromData(JSON.parse(trimmed));
      } catch (_e) {
        // No era JSON: se trata como texto.
      }
    }
    return stripHtml(data);
  }
  if (typeof data === 'object') {
    for (const key of ['message', 'error', 'description', 'responseText']) {
      const text = toText(data[key]);
      if (text) return text;
    }
  }
  return '';
}

/**
 * Convierte un error de axios (o cualquier otro) en HistrixApiError.
 * Idempotente: si ya es HistrixApiError lo devuelve tal cual.
 */
export function normalizeApiError(error) {
  if (error instanceof HistrixApiError) return error;
  const response = error?.response;
  if (!response) {
    // Con `request` pero sin `response` es un error de red/CORS/timeout.
    if (error?.request || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
      return new HistrixApiError({ status: 0, kind: 'network', message: NETWORK_MESSAGE, raw: error });
    }
    return new HistrixApiError({ status: 0, kind: 'unknown', message: error?.message || '', raw: error });
  }
  const status = response.status || 0;
  const kind = kindFromStatus(status);
  const message = messageFromData(response.data) || DEFAULT_MESSAGES[kind];
  return new HistrixApiError({ status, kind, message, raw: error });
}

export function isHistrixApiError(error) {
  return error instanceof HistrixApiError;
}
