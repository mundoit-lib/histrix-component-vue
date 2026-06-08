import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests colocalizados con el código de la librería (lógica pura del motor).
    include: ['ui/src/**/*.test.js'],
    environment: 'node'
  }
});
