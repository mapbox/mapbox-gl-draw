'use strict';

import Geometry from './geometry';
import { translatePoint, DOM } from '../util';
import InternalEvents from '../internal_events';

/**
 * Line geometry class
 *
 * @param {Object} options
 * @param {Map} options.map - Instance of MapboxGL Map
 * @param {Object} [options.data] - GeoJSON feature
 * @returns {Line} this
 */
export default class Line extends Geometry {

  constructor(options) {
    if (!options.data) {
      options.data = {
        geometry: {
          coordinates: [[0, 0], [0, 0]]
        }
      };
    }
    options.type = 'LineString';
    super(options);

    this.type = 'line';

    // event listeners
    this.addPoint = this._addPoint.bind(this);
    this.onMouseMove = this._onMouseMove.bind(this);
    this.completeDraw = this._completeDraw.bind(this);
  }

  startDraw() {
    this._map.getContainer().addEventListener('keyup', this.onKeyUp);
    InternalEvents.emit('drawing.start', { featureType: 'line' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.on('click', this.addPoint);
    this._map.on('dblclick', this.completeDraw);
  }

  _addPoint(e) {
    var p = [ e.lngLat.lng, e.lngLat.lat ];
    if (typeof this.vertexIdx === 'undefined') {
      this.coordinates = [p];
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
      this.vertexIdx = 0;
    } else {
      this.coordinates.splice(-1, 1, p, p);
    }
    this.vertexIdx++;

    this._renderDrawProgress();
  }

  _onMouseMove(e) {
    var pos = DOM.mousePos(e, this._map._container);
    var coords = this._map.unproject([pos.x, pos.y]);
    this.coordinates[this.vertexIdx] = [ coords.lng, coords.lat ];

    this._renderDrawProgress();
  }

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.addPoint);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);

    this.coordinates.splice(this.vertexIdx, 1);

    this._finishDrawing('line');
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
      this.initCoords = this.coordinates[idx];
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(JSON.parse(JSON.stringify(this.initCoords)), dx, dy, this._map);

    this.coordinates[idx] = newPoint;

    InternalEvents.emit('edit.new', {
      id: this.drawId,
      geojson: this.toGeoJSON()
    });
  }

  /**
   * Add a new vertex to a polygon in edit mode
   *
   * @param {Object} coords - The coordinates of the new vertex in the for { lng: <Number>, lat: <Number> }
   * @param {Number} idx - the index at which the new point will be placed in `feature.geometry.coordinates`
   */
  editAddVertex(coords, idx) {
    coords = this._map.unproject(coords);
    this.coordinates.splice(idx, 0, [ coords.lng, coords.lat ]);

    InternalEvents.emit('edit.new');
  }

}
