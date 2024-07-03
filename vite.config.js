// vite.config.js
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import { resolve } from 'path';

export default defineConfig({
  plugins: [eslint()],
  envPrefix: 'MAPBOX_',
  server: {
    host: '0.0.0.0',
    port: 9967,
    strictPort: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    lib: {
      entry: resolve(__dirname, 'index.js'),
      name: 'MapboxDraw',
      fileName: (format) => {
        switch (format) {
        case 'es':
          return 'mapbox-gl-draw-unminified.js';
        case 'umd':
          return 'mapbox-gl-draw.js';
        }
      }
    },
  }
});
