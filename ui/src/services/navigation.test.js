import { afterEach, describe, expect, it, vi } from 'vitest';
import { setHistrixApp } from './appContext.js';
import config from './config.js';
import { useHistrixNavigate } from './navigation.js';

const appWithRouter = (router) => ({ config: { globalProperties: { $router: router } } });

afterEach(() => {
  config.onNavigate = undefined;
  setHistrixApp(null);
});

describe('useHistrixNavigate', () => {
  it('sin router ni handler no hace nada', () => {
    const { navigate, back } = useHistrixNavigate();
    expect(navigate('/x')).toBe(false);
    expect(back()).toBe(false);
  });

  it('cae al $router de la app (push/replace/back) y traga el rechazo', async () => {
    const router = {
      push: vi.fn(() => Promise.reject(new Error('duplicada'))),
      replace: vi.fn(() => Promise.resolve()),
      back: vi.fn()
    };
    setHistrixApp(appWithRouter(router));
    const { navigate, back } = useHistrixNavigate();
    expect(navigate('/a')).toBe(true);
    navigate({ path: '/b' }, { replace: true });
    back();
    expect(router.push).toHaveBeenCalledWith('/a');
    expect(router.replace).toHaveBeenCalledWith({ path: '/b' });
    expect(router.back).toHaveBeenCalled();
    await Promise.resolve();
  });

  it('config.onNavigate tiene prioridad sobre el router', () => {
    const router = { push: vi.fn(), back: vi.fn() };
    setHistrixApp(appWithRouter(router));
    config.onNavigate = vi.fn();
    const { navigate, back } = useHistrixNavigate();
    navigate('/a');
    back();
    expect(config.onNavigate).toHaveBeenCalledWith('/a', { replace: false, back: false });
    expect(config.onNavigate).toHaveBeenCalledWith(null, { replace: false, back: true });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('la prop onNavigate (leída en cada llamada) gana sobre config', () => {
    config.onNavigate = vi.fn();
    const props = { onNavigate: null };
    const { navigate } = useHistrixNavigate(props);
    props.onNavigate = vi.fn();
    navigate('/x');
    expect(props.onNavigate).toHaveBeenCalledWith('/x', { replace: false, back: false });
    expect(config.onNavigate).not.toHaveBeenCalled();
  });
});
