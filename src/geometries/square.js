'use strict';

import Geometry from './geometry';
import { translatePoint, DOM } from '../util';

/**
 * Square geometry class
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @returns {Square} this
 * @private
 */
export default class Square extends Geometry {

  constructor(map) {
    var data = { geometry: {} };
    data.geometry.coordinates = [[[0, 0],[0, 0], [0, 0], [0, 0], [0, 0]]];
    super(map, 'Polygon', data);

    this.type = 'square';

    // event handlers
    this.onMouseDown = this._onMouseDown.bind(this);
    this.onMouseMove = this._onMouseMove.bind(this);
    this.completeDraw = this._completeDraw.bind(this);
  }

  startDraw() {
    this._map.getContainer().addEventListener('keyup', this.onKeyUp);
    this._map.fire('draw.start', { featureType: 'square' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.getContainer().addEventListener('mousedown', this.onMouseDown, true);
  }

  _onMouseDown(e) {
    this._map.getContainer().removeEventListener('mousedown', this.onMouseDown, true);
    this._map.getContainer().addEventListener('mousemove', this.onMouseMove, true);

    var pos = DOM.mousePos(e, this._map.getContainer());
    this.initPos = pos;
    var c = this._map.unproject([pos.x, pos.y]);
    var i = -1;
    while (++i < 5) {
      this.coordinates[0][i] = [ c.lng, c.lat ];
    }
  }

  _onMouseMove(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.started) {
      this.started = true;
      this._map.getContainer().addEventListener('mouseup', this.completeDraw, true);
    }

    var pos = DOM.mousePos(e, this._map._container);
    var c = this._map.unproject([pos.x, pos.y]);
    var ne = this._map.unproject([this.initPos.x, pos.y]);
    var sw = this._map.unproject([pos.x, this.initPos.y]);
    this.coordinates[0][1] = [ ne.lng, ne.lat ];
    this.coordinates[0][2] = [ c.lng, c.lat ];
    this.coordinates[0][3] = [ sw.lng, sw.lat ];

    this._renderDrawProgress();
  }

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove, true);
    this._map.getContainer().removeEventListener('mouseup', this.completeDraw, true);

    this._finishDrawing('square');
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

    this._map.fire('edit.new');
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
