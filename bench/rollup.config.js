
import flowRemoveTypes from '@mapbox/flow-remove-types';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import buble from '@rollup/plugin-buble';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

// Using this instead of rollup-plugin-flow due to
// https://github.com/leebyron/rollup-plugin-flow/issues/5
function flow() {
  return {
    name: 'flow-remove-types',
    transform: code => ({
      code: flowRemoveTypes(code).toString(),
      map: null
    })
  };
}

export default {
  input: ['bench/index.js'],
  output: {
    file: 'dist/bench.js',
    format: 'iife',
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
    flow(),
    json(),
    replace({
      'process.env.MapboxAccessToken': JSON.stringify(process.env.MapboxAccessToken),
      'process.env.MAPBOX_ACCESS_TOKEN': JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
    }),
    buble({transforms: {dangerousForOf: true}, objectAssign: "Object.assign"}),
    false,
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
