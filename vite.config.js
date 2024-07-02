// vite.config.js
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [eslint()],
  root: 'debug/',
  base: '/debug/',
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
  }
});
