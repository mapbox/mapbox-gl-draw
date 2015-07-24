'use strict';

var Immutable = require('immutable');
var xtend = require('xtend');
var Handler = require('./handlers');
var { translatePoint } = require('../util');

/**
 * Polygon geometry object
 *
 * @param {Object} map - Instance of MapboxGl Map
 * @param {Object} drawStore - The drawStore for this session
 * @param {Object} data - GeoJSON polygon feature
 */
function Polygon(map, drawStore, data) {

  this.initialize(map, drawStore, 'Polygon', data);

  // event handlers
  this.addVertex = this._addVertex.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

}

Polygon.prototype = xtend(Handler, {

  startDraw() {
    this._map.fire('draw.start', { featureType: 'polygon' });
    this._map.getContainer().classList.add('mapboxgl-draw-activated');
    this._map.on('click', this.addVertex);
    this._map.on('dblclick', this.completeDraw);
  },

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
  },

  _onMouseMove(e) {
    var coords = this._map.unproject([e.x, e.y]);
    var c = this.coordinates.get(0).splice(-1, 0, [ coords.lng, coords.lat ]);
    var temp = this.coordinates.set(0, c);
    this.store.update(this.feature.setIn(['geometry', 'coordinates'], temp).toJS());
  },

  _completeDraw() {
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');
    this._map.off('click', this.addVertex);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);
    this._map.getContainer().classList.remove('mapboxgl-draw-activated');

    this._done('polygon');
  },

  moveVertex(init, curr, vertex) {
    if (!this.movingVertex) {
      this.movingVertex = true;

      var coords = vertex.geometry.coordinates;
      var diff = Infinity;

      this.feature.getIn(['geometry', 'coordinates', 0]).forEach((v, i) => {
        //var d = Math.sqrt(Math.pow(v.get(0) - coords[1], 2) + Math.pow(v.get(1) - coords[0], 2));
        var d = Math.abs(v.get(0) - coords[0]);
        if (d < diff) {
          this.vertexIdx = i;
          diff = d;
        }
      });
      this.initCoords = this.feature.getIn(['geometry', 'coordinates', 0, this.vertexIdx]);
    }

    var dx = curr.x - init.x;
    var dy = curr.y - init.y;
    var newPoint = translatePoint(this.initCoords.toJS(), dx, dy, this._map);

    this.feature = this.feature.setIn(['geometry', 'coordinates', 0, this.vertexIdx], Immutable.fromJS(newPoint));
    if (this.vertexIdx === 0)
      this.feature = this.feature.setIn(['geometry', 'coordinates', 0, -1], Immutable.fromJS(newPoint));

    this.store.update(this.feature.toJS());
  }

});

module.exports = Polygon;
