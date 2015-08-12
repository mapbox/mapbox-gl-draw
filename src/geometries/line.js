'use strict';

import Geometry from './geometry';
import Immutable from 'immutable';
import { translatePoint, DOM } from '../util';

/**
 * Line geometry class
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @returns {Line} this
 * @private
 */
export default class Line extends Geometry {

  constructor(map) {
    var coordinates = Immutable.List([[0, 0], [0, 0]]);
    super(map, 'LineString', coordinates);

    this.type = 'line';

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
    if (typeof this.vertexIdx === 'undefined') {
      this.coordinates = Immutable.List([p]);
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
      this.vertexIdx = 0;
    } else {
      this.coordinates = this.coordinates.splice(-1, 1, p, p);
      this.vertexIdx++;
    }

    this._map.fire('new.edit');
  }

  _onMouseMove(e) {
    var pos = DOM.mousePos(e, this._map._container);
    var coords = this._map.unproject([pos.x, pos.y]);
    this.coordinates = this.coordinates.set(this.vertexIdx + 1,[ coords.lng, coords.lat ]);
    console.log(JSON.stringify(this.coordinates));

    this._map.fire('new.edit');
  }

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.addPoint);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);

    this.coordinates = this.coordinates.delete(this.vertexIdx + 1);

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
      this.initCoords = this.coordinates.get(idx);
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(JSON.parse(JSON.stringify(this.initCoords)), dx, dy, this._map);

    this.coordinates = this.coordinates.set(idx, newPoint);

    this._map.fire('new.edit');
  }

  /**
   * Add a new vertex to a polygon in edit mode
   *
   * @param {Object} coords - The coordinates of the new vertex in the for { lng: <Number>, lat: <Number> }
   * @param {Number} idx - the index at which the new point will be placed in `feature.geometry.coordinates`
   */
  editAddVertex(coords, idx) {
    coords = this._map.unproject(coords);
    this.coordinates = this.coordinates.splice(idx, 0, [ coords.lng, coords.lat ]);

    this._map.fire('new.edit');
  }

}
