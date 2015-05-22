'use strict';

/** A drawing component for mapboxgl
 * @class mapbox.Draw
 *
 * @param {Object} options
 * @param {String} [options.position=top-right] A string indicating the control's position on the map. Options are `topright`, `topleft`, `bottomright`, `bottomleft`
 * @returns {Draw} `this`
 * @example
 * var map = new mapboxgl.Map({
 *   container: 'map',
 *   style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json'
 * });
 *
 * // Initialize the drawing component
 * map.addControl(mapboxgl.Draw());
 */
mapboxgl.Draw = require('./src/draw.js');
