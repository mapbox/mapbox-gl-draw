'use strict';

var Immutable = require('immutable');
var xtend = require('xtend');
var Handler = require('./handlers');

/**
 * Square geometry object
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @param {Object} drawStore - The overall drawStore for this session
 * @param {Object} data - GeoJSON polygon feature
 */
function Square(map, drawStore, data) {

  this.initialize(map, drawStore, 'Polygon', data);

  // event handlers
  this.onMouseDown = this._onMouseDown.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

}

Square.prototype = xtend(Handler, {

  startDraw() {
    this._map.fire('draw.start', { featureType: 'square' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.getContainer().addEventListener('mousedown', this.onMouseDown, true);
  },

  _onMouseDown(e) {
    this._map.getContainer().removeEventListener('mousedown', this.onMouseDown, true);
    this._map.getContainer().addEventListener('mousemove', this.onMouseMove, true);

    var c = this._map.unproject([e.x, e.y]);
    var arr = [];
    var i = -1;
    while (++i < 5) {
      arr.push([ c.lng, c.lat]);
    }
    this.coordinates = this.coordinates.push(Immutable.fromJS(arr));
  },

  _onMouseMove(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.started) {
      this.started = true;
      this._map.getContainer().addEventListener('mouseup', this.completeDraw, true);
    }

    var c = this._map.unproject([e.x, e.y]);
    var orig = this.coordinates.get(0).get(0);
    this.coordinates = this.coordinates.setIn([0, 1], [ orig.get(0), c.lat ]);
    this.coordinates = this.coordinates.setIn([0, 2], [ c.lng, c.lat ]);
    this.coordinates = this.coordinates.setIn([0, 3], [ c.lng, orig.get(1)]);

    this.feature = this.feature.setIn(['geometry', 'coordinates'], this.coordinates);
    this.store.update(this.feature.toJS());
  },

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove, true);
    this._map.getContainer().removeEventListener('mouseup', this.completeDraw, true);

    this._done('square');
  }

});

module.exports = Square;
