const {MINIFY} = process.env;
const minified = MINIFY === 'true';
const outputFile = minified ? 'dist/maplibre-gl-draw.js' : 'dist/maplibre-gl-draw-unminified.js';

import replace from '@rollup/plugin-replace';
import buble from '@rollup/plugin-buble';
import {terser} from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: ['index.js'],
  output: {
    name: 'MapLibreDraw',
    file: outputFile,
    format: 'umd',
    sourcemap: true,
    indent: false
  },
  treeshake: true,
  plugins: [
    replace({
      'process.env.NODE_ENV': "'browser'",
      preventAssignment: true
    }),
    buble({transforms: {dangerousForOf: true}, objectAssign: "Object.assign"}),
    minified ? terser() : false,
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
