
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import buble from '@rollup/plugin-buble';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: ['bench/index.js'],
  output: {
    file: 'dist/bench.js',
    format: 'iife',
    sourcemap: true,
    indent: false
  },
  treeshake: true,
  plugins: [
    json(),
    replace({
      'process.env.MapboxAccessToken': JSON.stringify(process.env.MapboxAccessToken),
      'process.env.MAPBOX_ACCESS_TOKEN': JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
      preventAssignment: true
    }),
    buble({transforms: {dangerousForOf: true}, objectAssign: "Object.assign"}),
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
