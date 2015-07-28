'use strict';

import Geometry from './geometry';

/**
 * Point geometry class
 *
 * @param {Object} map - Instance of MpaboxGL Map
 * @param {Object} drawStore - The draw store for this session
 * @param {Object} [data] - GeoJSON polygon feature
 * @returns {Point} this
 */
export default class Point extends Geometry {

  constructor(map, drawStore, data) {
    super(map, drawStore, 'Point', data);
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
    this.feature = this.feature.setIn(['geometry', 'coordinates'], [ e.latLng.lng, e.latLng.lat ]);
    this._done('point');
  }

}
