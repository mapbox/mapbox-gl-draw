'use strict';

import Immutable from 'immutable';
import Geometry from './geometry';
import { translatePoint, DOM } from '../util';

/**
 * Polygon geometry class
 *
 * @param {Object} map - Instance of MapboxGl Map
 * @param {Object} [data] - GeoJSON feature
 * @returns {Polygon} this
 * @private
 */
export default class Polygon extends Geometry {

  constructor(map, data) {
    if (!data) data = { geometry: {} };
    data.geometry.coordinates = Immutable.fromJS(data.geometry.coordinates || [[[0, 0],[0, 0], [0, 0], [0, 0]]]);
    super(map, 'Polygon', data);

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
    var p = [ e.lngLat.lng, e.lngLat.lat ];

    if (typeof this.vertexIdx === 'undefined') {
      this.vertexIdx = 0;
      this.first = p;
      var coords = this.coordinates.get(0);
      this.coordinates = this.coordinates.set(0, coords.splice(0, 4, p, p, p, p));
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
    }

    this.vertexIdx++;

    this.coordinates = this.coordinates.setIn([0, this.vertexIdx], p);

    if (this.vertexIdx > 2) {
      var c = this.coordinates.get(0);
      this.coordinates = this.coordinates.set(0, c.push(this.first));
    }

    this._map.fire('new.edit');
  }

  _onMouseMove(e) {
    var pos = DOM.mousePos(e, this._map._container);
    var coords = this._map.unproject([pos.x, pos.y]);
    this.coordinates = this.coordinates.setIn([0, this.vertexIdx], [coords.lng, coords.lat]);

    this._map.fire('new.edit');
  }

  _completeDraw() {
    if (this.vertexIdx > 2) {
      var c = this.coordinates.get(0);
      this.coordinates = this.coordinates.set(0, c.remove(this.vertexIdx));
    }

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
   * @private
   */
  moveVertex(init, curr, idx) {
    if (!this.movingVertex) {
      this.movingVertex = true;
      this.initCoords = this.coordinates.getIn([0, idx]);
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(this.initCoords, dx, dy, this._map);

    this.coordinates = this.coordinates.setIn([0, idx], newPoint);
    if (idx === 0)
      this.coordinates = this.coordinates.setIn([0, -1], newPoint);

    this._map.fire('new.edit');
  }

  /**
   * Add a new vertex to a polygon in edit mode
   *
   * @param {Object} coords - The coordinates of the new vertex in the for { lng: <Number>, lat: <Number> }
   * @param {Number} idx - the index at which the new point will be placed in `feature.geometry.coordinates`
   * @private
   */
  editAddVertex(coords, idx) {
    coords = this._map.unproject(coords);
    var newCoords = this.coordinates.get(0).splice(idx, 0, [ coords.lng, coords.lat ]);
    this.coordinates = this.coordinates.set(0, newCoords);

    this._map.fire('new.edit');
  }

}
