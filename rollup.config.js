const {MINIFY} = process.env;
const minified = MINIFY === 'true';
const outputFile = minified ? 'dist/mapbox-gl-draw.js' : 'dist/mapbox-gl-draw-unminified.js';

import replace from '@rollup/plugin-replace';
import buble from '@rollup/plugin-buble';
import {terser} from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

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
  external: [
    // geojsonlint-lines has a main function that requires the path and fs module.
    // We never call it.
    'fs',
    'path'
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': "'browser'"
    }),
    buble({transforms: {dangerousForOf: true}, objectAssign: "Object.assign"}),
    minified ? terser() : false,
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      // global keyword handling causes Webpack compatibility issues, so we disabled it:
      // https://github.com/mapbox/mapbox-gl-js/pull/6956
      ignoreGlobal: true
    })
  ],
};
