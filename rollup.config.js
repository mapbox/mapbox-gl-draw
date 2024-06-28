const {MINIFY} = process.env;
const minified = MINIFY === 'true';
const outputFile = minified ? 'dist/mapbox-gl-draw.js' : 'dist/mapbox-gl-draw-unminified.js';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: ['index.js'],
  output: {
    name: 'MapboxDraw',
    file: outputFile,
    format: 'umd',
    sourcemap: true,
    indent: false
  },
  treeshake: true,
  plugins: [
    minified ? terser({
      ecma: 2020,
      module: true,
    }) : false,
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs({
      // global keyword handling causes Webpack compatibility issues, so we disabled it:
      // https://github.com/mapbox/mapbox-gl-js/pull/6956
      ignoreGlobal: true
    })
  ],
};
