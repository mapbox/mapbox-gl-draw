'use strict';

import Feature from './feature';

/**
 * Point geometry class
 *
 * @param {Object} options
 * @param {Map} options.map - Instance of MaboxGL Map
 * @param {Object} [options.data] - GeoJSON feature
 * @returns {Point} this
 */
export default class Point extends Feature {

  constructor(options) {
    if (!options.data) {
      options.data = {
        geometry: {
          coordinates: [0, 0]
        }
      };
    }
    options.type = 'Point';
    super(options);
  }

  onClick(e) {
    this._map.getContainer().classList.remove('mapbox-gl-draw_activated');
    this.coordinates = [ e.lngLat.lng, e.lngLat.lat ];
    this.created = true;
    this.ready = true;
  }
}
