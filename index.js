'use strict';

/** A drawing component for mapboxgl
 * @class mapboxgl.Draw
 *
 * @param {Object} options
 * @param {String} [options.position=top-left] A string indicating the control's position on the map. Options are `topright`, `topleft`, `bottomright`, `bottomleft`
 * @param {Boolean} [options.keybindings=true]
 * @param {Array<Object>} [options.geoJSON=[]] - an array of GeoJSON objects
 * @param {Boolean} [options.controls.marker=true]
 * @param {Boolean} [options.controls.line=true]
 * @param {Boolean} [options.controls.shape=true]
 * @param {Boolean} [options.controls.square=true]
 * @return {Draw} `this`
 * @example
 * // in the browser
 * var map = new mapboxgl.Map({
 *   container: 'map',
 *   style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json'
 * });
 * var Draw = mapboxgl.Draw();
 * map.addControl(Draw);
 *
 * // or using using node and browserify
 * var mapboxgl = require('mapbox-gl');
 * var GLDraw = require('mapbox-gl-draw');
 * var map = new mapboxgl.Map({
 *   container: 'map',
 *   style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json'
 * });
 * var Draw = GLDraw();
 * mapboxgl.addControl(Draw);
 */
import Draw from './src/draw';

function exportFn(options) {
  return new Draw(options);
}

if (window.mapboxgl) {
  mapboxgl.Draw = exportFn;
} else if (typeof module !== 'undefined') {
  module.exports = exportFn;
}
