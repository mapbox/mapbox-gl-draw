'use strict';

var xtend = require('xtend');
var Handler = require('./handlers');

/**
 * @param {Object} map - Instance of MapboxGL Map
 * @param {Object} drawStore - The overall drawStore for this session
 * @param {Object} data - GeoJSON line string feature
 */
function Line(map, drawStore, data) {

  this.initialize(map, drawStore, 'LineString', data);

  // event listeners
  this.addPoint = this._addPoint.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

}

Line.prototype = xtend(Handler, {

  startDraw() {
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.on('click', this.addPoint);
    this._map.on('dblclick', this.completeDraw);
  },

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
  },

  _onMouseMove(e) {
    var coords = this._map.unproject([e.x, e.y]);
    var c = this.coordinates;
    c = c.splice(-1, 1, [ coords.lng, coords.lat ]);
    this.store.update(this.feature.setIn(['geometry', 'coordinates'], c).toJS());
  },

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.addPoint);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);

    this.coodinates = this.coordinates.splice(-1, 1);

    this._done();
  }

});

module.exports = Line;
