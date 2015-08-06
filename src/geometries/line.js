'use strict';

import Geometry from './geometry';
import Immutable from 'immutable';
import { translatePoint, DOM } from '../util';

/**
 * Line geometry class
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @param {Object} drawStore - The overall drawStore for this session
 * @param {Object} [data] - GeoJSON line string feature
 * @returns {Line} this
 */
export default class Line extends Geometry {

  constructor(map, drawStore, data) {

    super(map, drawStore, 'LineString', data);

    // event listeners
    this.addPoint = this._addPoint.bind(this);
    this.onMouseMove = this._onMouseMove.bind(this);
    this.completeDraw = this._completeDraw.bind(this);

  }

  startDraw() {
    this._map.fire('draw.start', { featureType: 'line' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.on('click', this.addPoint);
    this._map.on('dblclick', this.completeDraw);
  }

  _addPoint(e) {
    var p = [ e.latLng.lng, e.latLng.lat ];
    if (!this.editting) {
      this.editting = true;
      this.coordinates = this.coordinates.push(p);
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
    }
    this.coordinates = this.coordinates.splice(-1, 1, p);
    this.coordinates = this.coordinates.push(p);
    this.feature = this.feature.setIn(['geometry', 'coordinates'], this.coordinates);
    this.store.update(this.feature.toJS());
  }

  _onMouseMove(e) {
    var pos = DOM.mousePos(e, this._map._container);
    var coords = this._map.unproject([pos.x, pos.y]);
    var c = this.coordinates;
    c = c.splice(-1, 1, [ coords.lng, coords.lat ]);
    this.store.update(this.feature.setIn(['geometry', 'coordinates'], c).toJS());
  }

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.addPoint);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);

    this.coordinates = this.coordinates.splice(-1, 1);
    this.feature = this.feature.setIn(['geometry', 'coordinates'], this.coordinates);

    this._done('line');
  }

  /**
   * Update the position of a vertex in the polygon
   *
   * @param {Array<Number>} init - the position of the mouse at the start of the drag
   * @param {Array<Number>} curr - the current position of the mouse
   * @param {Number} idx - the index of the point being updated in `feature.geometry.coordinates`
   */
  moveVertex(init, curr, idx) {
    if (!this.movingVertex) {
      this.movingVertex = true;
      this.initCoords = this.feature.getIn(['geometry', 'coordinates', idx]);
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(this.initCoords.toJS(), dx, dy, this._map);

    this.feature = this.feature.setIn(['geometry', 'coordinates', idx], Immutable.fromJS(newPoint));

    this.store.update(this.feature.toJS());
  }

  /**
   * Add a new vertex to a polygon in edit mode
   *
   * @param {Object} coords - The coordinates of the new vertex in the for { lng: <Number>, lat: <Number> }
   * @param {Number} idx - the index at which the new point will be placed in `feature.geometry.coordinates`
   */
  editAddVertex(coords, idx) {
    coords = this._map.unproject(coords);
    var newCoords = this.feature.getIn(['geometry', 'coordinates']).splice(idx, 0, Immutable.fromJS([ coords.lng, coords.lat ]));
    this.feature = this.feature.setIn(['geometry', 'coordinates'], newCoords);
    this.store.update(this.feature.toJS());
  }

}
