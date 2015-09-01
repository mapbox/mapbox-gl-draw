'use strict';

import Geometry from './geometry';
import Immutable from 'immutable';

/**
 * Point geometry class
 *
 * @param {Object} map - Instance of MaboxGL Map
 * @param {Object} [data] - GeoJSON feature
 * @returns {Point} this
 * @private
 */
export default class Point extends Geometry {

  constructor(map, data) {
    var coordinates = Immutable.List(data ? data.geometry.coordinates : [0, 0]);
    super(map, 'Point', coordinates);
    this.type = 'point';
    this.completeDraw = this._completeDraw.bind(this);
  }

  startDraw() {
    this._map.fire('draw.start', { featureType: 'point' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.on('click', this.completeDraw);
  }

  _completeDraw(e) {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.completeDraw);
    this.coordinates = Immutable.List([ e.lngLat.lng, e.lngLat.lat ]);
    this._done('point');
  }

}
