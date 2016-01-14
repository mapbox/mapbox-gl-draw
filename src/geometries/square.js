'use strict';

import Geometry from './geometry';
import { translatePoint, DOM } from '../util';

/**
 * Square geometry class
 *
 * @param {Object} options
 * @param {Map} options.map - Instance of MapboxGL Map
 * @returns {Square} this
 */
export default class Square extends Geometry {

  constructor(options) {
    options.data = {
      geometry: {
        coordinates: [[[0, 0],[0, 0], [0, 0], [0, 0], [0, 0]]]
      }
    };
    options.type = 'Polygon';
    super(options);

    this.type = 'square';

    // event handlers
    this.onMouseDown = this._onMouseDown.bind(this);
    this.onMouseDrag = this._onMouseDrag.bind(this);
    this.onMouseUp = this._completeDraw.bind(this);
  }

  startDraw() {
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
  }

  _onMouseDown(e) {
    this.ready = true;
    var pos = DOM.mousePos(e, this._map.getContainer());
    this.initPos = pos;
    var c = this._map.unproject([pos.x, pos.y]);
    var p = [ c.lng, c.lat ];
    this.coordinates = [[ p, p, p, p, p ]];
  }

  _onMouseDrag(e) {
    if (this.initPos) {
      if (!this.started) {
        this.started = true;
      }

      var pos = DOM.mousePos(e.originalEvent, this._map._container);
      var c = this._map.unproject([pos.x, pos.y]);
      var ne = this._map.unproject([this.initPos.x, pos.y]);
      var sw = this._map.unproject([pos.x, this.initPos.y]);
      this.coordinates[0][1] = [ ne.lng, ne.lat ];
      this.coordinates[0][2] = [ c.lng, c.lat ];
      this.coordinates[0][3] = [ sw.lng, sw.lat ];
    }
  }

  onStopDrawing() {
    return this._completeDraw();
  }

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    if (!this.started) { // simply clicked, didn't draw
      return;
    }
    this.started = false;
    this.created = true;
  }

  moveVertex(init, curr, idx) {
    if (!this.movingVertex) {
      this.movingVertex = true;
      this.initCoords = this.coordinates[0][idx];
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(JSON.parse(JSON.stringify(this.initCoords)), dx, dy, this._map);

    this.coordinates[0][idx] = newPoint;

    var ne, nw, se, sw;
    switch (idx) {
      case 0:
        ne = this._getNE(newPoint, this.coordinates[0][2]);
        sw = this._getSW(newPoint, this.coordinates[0][2]);
        this.coordinates[0][1] = [ ne.lng, ne.lat ];
        this.coordinates[0][3] = [ sw.lng, sw.lat ];
        break;
      case 1:
        nw = this._getNW(newPoint, this.coordinates[0][3]);
        se = this._getSE(newPoint, this.coordinates[0][3]);
        this.coordinates[0][0] = [ nw.lng, nw.lat ];
        this.coordinates[0][2] = [ se.lng, se.lat ];
        break;
      case 2:
        ne = this._getNE(this.coordinates[0][0], newPoint);
        sw = this._getSW(this.coordinates[0][0], newPoint);
        this.coordinates[0][1] = [ ne.lng, ne.lat ];
        this.coordinates[0][3] = [ sw.lng, sw.lat ];
        break;
      case 3:
        nw = this._getNW(this.coordinates[0][1], newPoint);
        se = this._getSE(this.coordinates[0][1], newPoint);
        this.coordinates[0][0] = [ nw.lng, nw.lat ];
        this.coordinates[0][2] = [ se.lng, se.lat ];
        break;
    }

    // always reset last point to equal the first point
    this.coordinates[0][4] = this.coordinates[0][0];
  }

  _getNE(nw, se) {
    var nwPx = this._map.project(nw);
    var sePx = this._map.project(se);
    var nePx = [sePx.x, nwPx.y];
    return this._map.unproject(nePx);
  }

  _getNW(ne, sw) {
    var nePx = this._map.project(ne);
    var swPx = this._map.project(sw);
    var nwPx = [swPx.x, nePx.y];
    return this._map.unproject(nwPx);
  }

  _getSE(ne, sw) {
    var nePx = this._map.project(ne);
    var swPx = this._map.project(sw);
    var sePx = [nePx.x, swPx.y];
    return this._map.unproject(sePx);
  }
  _getSW(nw, se) {
    var nwPx = this._map.project(nw);
    var sePx = this._map.project(se);
    var swPx = [nwPx.x, sePx.y];
    return this._map.unproject(swPx);
  }

}
