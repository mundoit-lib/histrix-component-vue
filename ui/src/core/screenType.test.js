import { describe, expect, it } from 'vitest';

import { resolveScreenKind } from './screenType.js';

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

  it('acepta todas las grafías que acepta el backend', () => {
    expect(resolveScreenKind('abmmini')).toBe('table');
    expect(resolveScreenKind('ABM-Mini')).toBe('table');
    expect(resolveScreenKind('livegrid')).toBe('table');
    expect(resolveScreenKind('live-grid')).toBe('table');
    expect(resolveScreenKind('Consulta')).toBe('table');
    expect(resolveScreenKind('FichaIng')).toBe('form');
    expect(resolveScreenKind('consula')).toBe('table');
  });

  it('mapea los types de árbol a "tree"', () => {
    expect(resolveScreenKind('tree')).toBe('tree');
    expect(resolveScreenKind('arbol')).toBe('tree');
  });

  it('chart va a "chart"; map y treeView ya no', () => {
    expect(resolveScreenKind('chart')).toBe('chart');
    expect(resolveScreenKind('map')).toBe('map');
    expect(resolveScreenKind('treeView')).toBe('treeview');
  });

  it('da kinds propios a las pantallas sin componente', () => {
    expect(resolveScreenKind('TreeTable')).toBe('treetable');
    expect(resolveScreenKind('orgchart')).toBe('orgchart');
    expect(resolveScreenKind('card')).toBe('card');
    expect(resolveScreenKind('cards')).toBe('card');
    expect(resolveScreenKind('kanban')).toBe('kanban');
    expect(resolveScreenKind('horizontalGrid')).toBe('horizontalgrid');
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

  it('devuelve null para raíces que no son pantallas y tipos desconocidos', () => {
    expect(resolveScreenKind('insert')).toBeNull();
    expect(resolveScreenKind('update')).toBeNull();
    expect(resolveScreenKind('dalete')).toBeNull();
    expect(resolveScreenKind('inexistente')).toBeNull();
    expect(resolveScreenKind('')).toBeNull();
    expect(resolveScreenKind(undefined)).toBeNull();
    expect(resolveScreenKind(null)).toBeNull();
  });
});
