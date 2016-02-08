'use strict';

import Feature from './feature';
import { translatePoint } from '../util';

/**
 * Polygon geometry class
 *
 * @param {Object} options
 * @param {Map} options.map - Instance of MapboxGl Map
 * @param {Object} [options.data] - GeoJSON feature
 * @returns {Polygon} this
 */
export default class Polygon extends Feature {

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
  }

  onClick(e) {
    var p = [ e.lngLat.lng, e.lngLat.lat ];

    if (typeof this.vertexIdx === 'undefined') {
      this.vertexIdx = 0;
      this.first = p;
      this.coordinates = [[p, p, p, p]];
      this.ready = true;
    }

    if (this.vertexIdx > 1) {
      this.coordinates[0].push(this.first);
    }

    this.coordinates[0][this.vertexIdx] = p;

    this.vertexIdx++;
  }

  onMouseMove(e) {
    this.coordinates[0][this.vertexIdx] = [ e.lngLat.lng, e.lngLat.lat ];
  }

  onStopDrawing(e) {
    return this.onDoubleClick(e);
  }

  onDoubleClick(e) {
    const ENTER = 13;
    if (this.vertexIdx > 2) {
      var idx = this.vertexIdx - (e.keyCode === ENTER ? 0 : 1);
      var remove = e.keyCode === ENTER ? 1 : 2;
      this.coordinates[0].splice(idx, remove);
    }
    if (this.vertexIdx < 3 || this.coordinates[0].length < 4) {
      this.toRemove = true;
    }
    super.onStopDrawing(e);
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
    this.coordinates[0].splice(idx, 0, coords);
  }

  removeVertex(idx) {
    this.coordinates[0].splice(idx, 1);
    this.coordinates[0][this.coordinates[0].length - 1] = this.coordinates[0][0];
    if (this.coordinates[0].length <= 3) {
      this.ready = false;
      return true;
    }
    return false;
  }

}
