// Config UnoCSS — espejo de la que usan las apps reales de Mundo IT
// (ver angel-alvarez-frontend/unocss.config.js): clases utility estilo
// Tailwind (presetUno + presetWind) conviviendo con Quasar sin conflictos.
import { presetUno } from '@unocss/preset-uno';
import { presetWind } from '@unocss/preset-wind';
import { defineConfig } from 'unocss';

export default defineConfig({
  shortcuts: [
    // ...
  ],
  theme: {
    colors: {
      $primary: '#049DD9',
      $secondary: '#F25C05',
      negative: '#eb0405'
    },
    // Mismos breakpoints que Quasar.
    breakpoints: {
      sm: '600px',
      md: '800px',
      lg: '1200px'
    }
  },
  presets: [presetUno(), presetWind()]
});
