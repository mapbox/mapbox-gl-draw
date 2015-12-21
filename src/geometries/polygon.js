'use strict';

import Geometry from './geometry';
import { translatePoint, DOM } from '../util';

/**
 * Polygon geometry class
 *
 * @param {Object} options
 * @param {Map} options.map - Instance of MapboxGl Map
 * @param {Object} [options.data] - GeoJSON feature
 * @returns {Polygon} this
 */
export default class Polygon extends Geometry {

  constructor(options) {
    if (!options.data) {
      options.data = {
        geometry: {
          coordinates: [[[0, 0],[0, 0], [0, 0], [0, 0]]]
        }
      };
    }
    options.type = 'Polygon';
    super(options);

    // event handlers
    this.onMouseMove = this._onMouseMove.bind(this);
  }

  startDraw() {
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
  }

  onClick(e) {
    var p = [ e.lngLat.lng, e.lngLat.lat ];

    if (typeof this.vertexIdx === 'undefined') {
      this.vertexIdx = 0;
      this.first = p;
      this.coordinates[0].splice(0, 4, p, p, p, p);
      this.ready = true;
    }

    this.vertexIdx++;

    this.coordinates[0][this.vertexIdx] = p;

    if (this.vertexIdx > 2) {
      this.coordinates[0].push(this.first);
    }
  }

  _onMouseMove(e) {
    var pos = DOM.mousePos(e.originalEvent, this._map._container);
    var coords = this._map.unproject([pos.x, pos.y]);
    this.coordinates[0][this.vertexIdx] = [ coords.lng, coords.lat ];
  }

  onStopDrawing() {
    return this.onDoubleClick();
  }

  onDoubleClick() {
    if (this.vertexIdx > 2) {
      this.coordinates[0].splice(this.vertexIdx, 1);
    }

    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this.created = true;
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
      this.initCoords = JSON.parse(JSON.stringify(this.coordinates[0][idx]));
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(this.initCoords, dx, dy, this._map);

    this.coordinates[0][idx] = newPoint;
    if (idx === 0) {
      this.coordinates[0][this.coordinates[0].length - 1] = newPoint;
    }
  }

  /**
   * Add a new vertex to a polygon in selected mode
   *
   * @param {Object} coords - The coordinates of the new vertex in the for { lng: <Number>, lat: <Number> }
   * @param {Number} idx - the index at which the new point will be placed in `feature.geometry.coordinates`
   * @private
   */
  addVertex(coords, idx) {
    coords = this._map.unproject(coords);
    this.coordinates[0].splice(idx, 0, [ coords.lng, coords.lat ]);
  }

}
