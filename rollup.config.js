import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const { MINIFY } = process.env;
const minified = MINIFY === 'true';
const outputFile = minified
  ? 'dist/mapbox-gl-draw.js'
  : 'dist/mapbox-gl-draw-unminified.js';

export default {
  input: 'index.ts',
  output: {
    name: 'MapboxDraw',
    file: outputFile,
    format: 'esm',
    sourcemap: true,
    indent: false
  },
  treeshake: true,
  plugins: [
    typescript(),
    minified ? terser({
      ecma: 2020,
      module: true,
    }) : false,
  ]
};
