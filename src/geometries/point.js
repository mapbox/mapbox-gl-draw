'use strict';

import Geometry from './geometry';
import Immutable from 'immutable';

/**
 * Point geometry class
 *
 * @param {Object} map - Instance of MpaboxGL Map
 * @returns {Point} this
 * @private
 */
export default class Point extends Geometry {

  constructor(map) {
    var coordinates = Immutable.List([0, 0]);
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
    this.coordinates = Immutable.List([ e.latLng.lng, e.latLng.lat ]);
    this._done('point');
  }

}
