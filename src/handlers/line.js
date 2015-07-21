'use strict';

var Immutable = require('immutable');
var hat = require('hat');
var EditStore = require('../edit_store');

function Line(map, drawStore, feature) {

  this._map = map;
  this.store = new EditStore(this._map);
  this.drawStore = drawStore;

  if (feature) {
    this.coordinates = Immutable.List(feature.geometry.coordinates);
  } else {
    this.coordinates = Immutable.List([]);
  }

  this.feature = {
    type: 'Feature',
    properties: {
      _drawid: hat()
    },
    geometry: {
      type: 'LineString',
      coordinates: this.coordinates.toJS()
    }
  };

  // event listeners
  this.addPoint = this._addPoint.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

}

Line.prototype = {

  startDraw() {
    this._map.on('click', this.addPoint);
    this._map.on('dblclick', this.completeDraw);
  },

  _addPoint(e) {
    var p = [ e.latLng.lng, e.latLng.lat ];
    if (this.editting) {
      this.coordinates = this.coordinates.splice(-1, 1, p);
    } else {
      this.editting = true;
      this.coordinates = this.coordinates.push(p);
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
    }
    this.coordinates = this.coordinates.push(p);
    this.feature.geometry.coordinates = this.coordinates.toJS();
    this.store.update(this.feature);
  },

  _onMouseMove(e) {
    var coords = this._map.unproject([e.x, e.y]);
    var c = this.coordinates;
    c = c.splice(-1, 1, [ coords.lng, coords.lat ]);
    this.feature.geometry.coordinates = c.toJS();
    this.store.update(this.feature);
  },

  _completeDraw() {
    // remove draw event listener
    this._map.off('click', this.addPoint);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);

    this.coodinates = this.coordinates.splice(-1, 1);

    // render the changes
    this.store.clear();
    this.drawStore.set('LineString', hat(), this.coordinates.toJS());
  },

  startEdit() {}
};

module.exports = Line;
