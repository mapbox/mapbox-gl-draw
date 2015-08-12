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

  constructor(map) {
    super(map, 'Point');
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
    this.geojson = this.geojson.setIn(['geometry', 'coordinates'], [ e.latLng.lng, e.latLng.lat ]);
    this._done('point');
  }

}
