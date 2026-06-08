import { describe, expect, it } from 'vitest';

import { SCREEN_TYPE_TO_KIND, resolveScreenKind } from './screenType.js';

describe('resolveScreenKind', () => {
  it('mapea los types de formulario a "form"', () => {
    expect(resolveScreenKind('ficha')).toBe('form');
    expect(resolveScreenKind('fichaing')).toBe('form');
    expect(resolveScreenKind('cabecera')).toBe('form');
  });

  it('mapea los types tabulares a "table"', () => {
    expect(resolveScreenKind('consulta')).toBe('table');
    expect(resolveScreenKind('crud')).toBe('table');
    expect(resolveScreenKind('abm')).toBe('table');
    expect(resolveScreenKind('abm-mini')).toBe('table');
    expect(resolveScreenKind('ing')).toBe('table');
    expect(resolveScreenKind('grid')).toBe('table');
    expect(resolveScreenKind('liveGrid')).toBe('table');
    expect(resolveScreenKind('help')).toBe('table');
    expect(resolveScreenKind('ayuda')).toBe('table');
  });

  it('mapea los types de árbol a "tree"', () => {
    expect(resolveScreenKind('tree')).toBe('tree');
    expect(resolveScreenKind('arbol')).toBe('tree');
  });

  it('mapea chart, map y treeView a "chart" (todos HistrixChart en el original)', () => {
    expect(resolveScreenKind('chart')).toBe('chart');
    expect(resolveScreenKind('map')).toBe('chart');
    expect(resolveScreenKind('treeView')).toBe('chart');
  });

  it('mapea calendar y gantt a "calendar"', () => {
    expect(resolveScreenKind('calendar')).toBe('calendar');
    expect(resolveScreenKind('gantt')).toBe('calendar');
  });

  it('mapea dashboard a "dashboard"', () => {
    expect(resolveScreenKind('dashboard')).toBe('dashboard');
  });

  it('mapea list a "list"', () => {
    expect(resolveScreenKind('list')).toBe('list');
  });

  it('devuelve null para un type desconocido', () => {
    expect(resolveScreenKind('inexistente')).toBeNull();
    expect(resolveScreenKind('')).toBeNull();
    expect(resolveScreenKind(undefined)).toBeNull();
    expect(resolveScreenKind(null)).toBeNull();
  });

  it('cubre exactamente los types del mapa original (sin sobras ni faltantes)', () => {
    expect(Object.keys(SCREEN_TYPE_TO_KIND).sort()).toEqual(
      [
        'ficha',
        'fichaing',
        'cabecera',
        'calendar',
        'gantt',
        'dashboard',
        'tree',
        'arbol',
        'treeView',
        'map',
        'chart',
        'list',
        'consulta',
        'crud',
        'abm',
        'ing',
        'grid',
        'liveGrid',
        'help',
        'ayuda',
        'abm-mini'
      ].sort()
    );
  });
});
