import { describe, expect, it } from 'vitest';

import {
  isFocusCandidate,
  isInIgnoredZone,
  isTypingTarget,
  matchHotkey,
  nextFocusable,
  pickScope,
  resolveAction
} from './hotkeys.js';

/** Elemento falso: tagName/type y una lista de selectores que "matchea" closest. */
function el({ tag = 'INPUT', type = 'text', inside = [], attrs = {}, ...rest } = {}) {
  return {
    tagName: tag,
    type,
    closest: (selector) => (inside.some((s) => selector.includes(s)) ? {} : null),
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    offsetParent: {},
    ...rest
  };
}

const key = (k, extra = {}) => ({ key: k, target: el(), ...extra });

describe('resolveAction', () => {
  it('mapea las teclas del legacy', () => {
    expect(resolveAction(key('F9'))).toBe('process');
    expect(resolveAction(key('Escape'))).toBe('close');
    expect(resolveAction(key('F2'))).toBe('help');
    expect(resolveAction(key('F4'))).toBe('clear');
    expect(resolveAction(key('Enter'))).toBe('nextField');
  });

  it('teclas sin atajo devuelven null', () => {
    expect(resolveAction(key('a'))).toBeNull();
    expect(resolveAction(key('Tab'))).toBeNull();
    expect(resolveAction(null)).toBeNull();
  });

  it('keyboard: false apaga todo', () => {
    expect(resolveAction(key('F9'), { enabled: false })).toBeNull();
    expect(resolveAction(key('Enter'), { enabled: false })).toBeNull();
  });

  it('ignora eventos con modificadores, consumidos o en composición', () => {
    expect(resolveAction(key('Enter', { shiftKey: true }))).toBeNull();
    expect(resolveAction(key('F9', { ctrlKey: true }))).toBeNull();
    expect(resolveAction(key('F4', { altKey: true }))).toBeNull();
    expect(resolveAction(key('Enter', { defaultPrevented: true }))).toBeNull();
    expect(resolveAction(key('Enter', { isComposing: true }))).toBeNull();
  });

  it('no intercepta nada dentro de textarea, contenteditable o QEditor', () => {
    expect(resolveAction(key('Enter', { target: el({ tag: 'TEXTAREA', inside: ['textarea'] }) }))).toBeNull();
    expect(resolveAction(key('F9', { target: el({ tag: 'DIV', inside: ['.q-editor'] }) }))).toBeNull();
    expect(resolveAction(key('Escape', { target: el({ tag: 'DIV', inside: ['contenteditable'] }) }))).toBeNull();
  });

  it('Enter sólo avanza desde inputs de texto', () => {
    expect(resolveAction(key('Enter', { target: el({ tag: 'BUTTON' }) }))).toBeNull();
    expect(resolveAction(key('Enter', { target: el({ type: 'checkbox' }) }))).toBeNull();
    expect(resolveAction(key('Enter', { target: el({ type: 'submit' }) }))).toBeNull();
    expect(resolveAction(key('Enter', { target: el({ type: 'number' }) }))).toBe('nextField');
    expect(resolveAction(key('Enter', { target: null }))).toBeNull();
  });

  it('Enter no avanza con el menú del QSelect abierto', () => {
    const target = el({ attrs: { 'aria-expanded': 'true' } });
    expect(resolveAction(key('Enter', { target }))).toBeNull();
    expect(resolveAction(key('Enter', { target: el({ attrs: { 'aria-expanded': 'false' } }) }))).toBe('nextField');
  });

  it('F9 / Esc andan aunque el foco no esté en un input', () => {
    expect(resolveAction(key('F9', { target: el({ tag: 'BODY' }) }))).toBe('process');
    expect(resolveAction(key('Escape', { target: null }))).toBe('close');
  });
});

describe('isTypingTarget', () => {
  it('inputs, selects y zonas de edición son de escritura', () => {
    expect(isTypingTarget(el())).toBe(true);
    expect(isTypingTarget(el({ tag: 'SELECT' }))).toBe(true);
    expect(isTypingTarget(el({ tag: 'DIV', inside: ['.q-editor'] }))).toBe(true);
  });

  it('body, botones y null no', () => {
    expect(isTypingTarget(el({ tag: 'BODY' }))).toBe(false);
    expect(isTypingTarget(el({ tag: 'BUTTON' }))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('isInIgnoredZone', () => {
  it('detecta zonas protegidas', () => {
    expect(isInIgnoredZone(el({ inside: ['textarea'] }))).toBe(true);
    expect(isInIgnoredZone(el())).toBe(false);
    expect(isInIgnoredZone(null)).toBe(false);
    expect(isInIgnoredZone({})).toBe(false);
  });
});

/** Nodo falso con contains() basado en una lista de descendientes. */
function node(name, children = []) {
  const n = { name, children };
  n.contains = (other) => other === n || children.some((c) => c === other || c.contains?.(other));
  return n;
}

describe('pickScope', () => {
  const field = node('field');
  const innerEl = node('inner', [field]);
  const outerEl = node('outer', [innerEl]);
  const otherEl = node('other');
  const outer = { id: 'outer', el: outerEl };
  const inner = { id: 'inner', el: innerEl };
  const other = { id: 'other', el: otherEl };

  it('elige el scope más interno que contiene el target, sin importar el orden', () => {
    expect(pickScope([outer, inner, other], field)).toBe(inner);
    expect(pickScope([inner, outer, other], field)).toBe(inner);
  });

  it('elige el que contiene el target aunque no sea el último', () => {
    expect(pickScope([outer, other], field)).toBe(outer);
  });

  it('sin target contenido, toma el último registrado', () => {
    expect(pickScope([outer, other], node('body'))).toBe(other);
    expect(pickScope([outer, other], null)).toBe(other);
  });

  it('sin scopes vivos devuelve null', () => {
    expect(pickScope([], field)).toBeNull();
    expect(pickScope([{ el: null }], field)).toBeNull();
    expect(pickScope(undefined, field)).toBeNull();
  });
});

describe('isFocusCandidate', () => {
  it('acepta inputs editables y visibles', () => {
    expect(isFocusCandidate(el())).toBe(true);
    expect(isFocusCandidate(el({ tag: 'TEXTAREA', type: '' }))).toBe(true);
  });

  it('descarta deshabilitados, readonly, ocultos y botones', () => {
    expect(isFocusCandidate(el({ disabled: true }))).toBe(false);
    expect(isFocusCandidate(el({ readOnly: true }))).toBe(false);
    expect(isFocusCandidate(el({ type: 'hidden' }))).toBe(false);
    expect(isFocusCandidate(el({ type: 'checkbox' }))).toBe(false);
    expect(isFocusCandidate(el({ offsetParent: null }))).toBe(false);
    expect(isFocusCandidate(el({ attrs: { tabindex: '-1' } }))).toBe(false);
    expect(isFocusCandidate(el({ tag: 'BUTTON' }))).toBe(false);
    expect(isFocusCandidate(null)).toBe(false);
  });
});

describe('nextFocusable', () => {
  const a = { n: 'a' };
  const b = { n: 'b' };
  const c = { n: 'c' };

  it('devuelve el siguiente en orden', () => {
    expect(nextFocusable([a, b, c], a)).toBe(b);
    expect(nextFocusable([a, b, c], b)).toBe(c);
  });

  it('en el último (o fuera de la lista) devuelve null', () => {
    expect(nextFocusable([a, b, c], c)).toBeNull();
    expect(nextFocusable([a, b], c)).toBeNull();
    expect(nextFocusable(null, a)).toBeNull();
  });
});

describe('matchHotkey', () => {
  it('ctrl+k acepta Ctrl o Cmd', () => {
    expect(matchHotkey({ key: 'k', ctrlKey: true }, 'ctrl+k')).toBe(true);
    expect(matchHotkey({ key: 'K', metaKey: true }, 'ctrl+k')).toBe(true);
    expect(matchHotkey({ key: 'k' }, 'ctrl+k')).toBe(false);
    expect(matchHotkey({ key: 'k', ctrlKey: true, shiftKey: true }, 'ctrl+k')).toBe(false);
  });

  it('meta+k exige Cmd', () => {
    expect(matchHotkey({ key: 'k', metaKey: true }, 'meta+k')).toBe(true);
    expect(matchHotkey({ key: 'k', ctrlKey: true }, 'meta+k')).toBe(false);
  });

  it('teclas sueltas no aceptan modificadores', () => {
    expect(matchHotkey({ key: '/' }, '/')).toBe(true);
    expect(matchHotkey({ key: '/', ctrlKey: true }, '/')).toBe(false);
  });

  it('valores vacíos no matchean', () => {
    expect(matchHotkey(null, 'ctrl+k')).toBe(false);
    expect(matchHotkey({ key: 'k' }, '')).toBe(false);
  });
});
