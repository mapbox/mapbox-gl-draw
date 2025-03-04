const { MINIFY } = process.env;
const minified = MINIFY === 'true';
const outputFile = minified
  ? 'dist/mapbox-gl-draw.js'
  : 'dist/mapbox-gl-draw-unminified.js';

import typescript from '@rollup/plugin-typescript';

export default {
  input: 'index.ts',
  output: {
    name: 'MapboxDraw',
    file: outputFile,
    format: 'esm', // Ensure ESM output if using ES modules
    sourcemap: true
  },
  plugins: [typescript()]
};
