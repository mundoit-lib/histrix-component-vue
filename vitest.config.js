import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests colocalizados con el código de la librería (lógica pura del motor).
    include: ['ui/src/**/*.test.js'],
    environment: 'node',
    // TZ fijo para que los tests de fechas (que preservan el workaround de
    // timezone del motor) sean deterministas. La validación en huso real va
    // por el playground.
    env: { TZ: 'UTC' }
  }
});
