'use strict';

import Immutable from 'immutable';
import Geometry from './geometry';
import { translatePoint } from '../util';

/**
 * Polygon geometry object
 *
 * @param {Object} map - Instance of MapboxGl Map
 * @param {Object} drawStore - The drawStore for this session
 * @param {Object} data - GeoJSON polygon feature
 * @return {Polygon} this
 */
export default class Polygon extends Geometry {

  constructor(map, drawStore, data) {
    super(map, drawStore, 'Polygon', data);

    // event handlers
    this.addVertex = this._addVertex.bind(this);
    this.onMouseMove = this._onMouseMove.bind(this);
    this.completeDraw = this._completeDraw.bind(this);

  }


  startDraw() {
    this._map.fire('draw.start', { featureType: 'polygon' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.on('click', this.addVertex);
    this._map.on('dblclick', this.completeDraw);
  }

  _addVertex(e) {
    var p = [ e.latLng.lng, e.latLng.lat ];

    if (this.editting) {
      var c = this.coordinates.get(0).splice(-1, 0, p);
      this.coordinates = this.coordinates.set(0, c);
    } else {
      this.editting = true;
      this.coordinates = Immutable.fromJS([[ p, p ]]);
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
    }

    this.feature = this.feature.setIn(['geometry', 'coordinates'], this.coordinates);
    this.store.update(this.feature.toJS());
  }

  _onMouseMove(e) {
    var coords = this._map.unproject([e.x, e.y]);
    var c = this.coordinates.get(0).splice(-1, 0, [ coords.lng, coords.lat ]);
    var temp = this.coordinates.set(0, c);
    this.store.update(this.feature.setIn(['geometry', 'coordinates'], temp).toJS());
  }

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.addVertex);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');

    this._done('polygon');
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
      this.initCoords = this.feature.getIn(['geometry', 'coordinates', 0, idx]);
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(this.initCoords.toJS(), dx, dy, this._map);

    this.feature = this.feature.setIn(['geometry', 'coordinates', 0, idx], Immutable.fromJS(newPoint));
    if (idx === 0)
      this.feature = this.feature.setIn(['geometry', 'coordinates', 0, -1], Immutable.fromJS(newPoint));

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
    var newCoords = this.feature.getIn(['geometry', 'coordinates', 0]).splice(idx, 0, Immutable.fromJS([ coords.lng, coords.lat ]));
    this.feature = this.feature.setIn(['geometry', 'coordinates', 0], newCoords);
    this.store.update(this.feature.toJS());
  }

}
