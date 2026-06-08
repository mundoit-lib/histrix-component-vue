import { defineAsyncComponent } from 'vue';

/**
 * Wrapper de defineAsyncComponent con estados de carga/error por defecto.
 * Acepta tanto una función loader `() => import('...')` (lazy real) como
 * una Promise ya disparada (compatibilidad con call-sites viejos).
 */
export function defineLazyComponent(loader, options = {}) {
  const normalizedLoader = () =>
    Promise.resolve()
      .then(() => (typeof loader === 'function' ? loader() : loader))
      .then((m) => (m?.__esModule ? m.default || m : m.default || m));

  const defaultLoading = { template: '<div>Cargando...</div>' };
  const defaultError = { template: '<div>Error al cargar componente</div>' };

  const { loading = defaultLoading, error = defaultError, delay, timeout } = options;

  return defineAsyncComponent({
    loader: normalizedLoader,
    loadingComponent: loading,
    errorComponent: error,
    delay,
    timeout
  });
}
