'use strict';

var Immutable = require('immutable');
var hat = require('hat');
var EditStore = require('../edit_store');

function Point(map, drawStore, data) {

  this._map = map;
  this.store = new EditStore(this._map);
  this.drawStore = drawStore;

  if (data) {
    this.drawStore.set('Point', hat(), data);
  } else {
    this.coordinates = Immutable.List([]);
  }

  this.feature = {
    type: 'Feature',
    properties: {
      _drawid: hat()
    },
    geometry: {
      type: 'Polygon',
      coordinates: this.coordinates.toJS()
    }
  };

  // event handler
  this.completeDraw = this._completeDraw.bind(this);
}

Point.prototype = {

  startDraw() {
    this._map.on('click', this.completeDraw);
  },

  _completeDraw(e) {
    this._map.off('click', this.completeDraw);
    this.drawStore.set('Point', hat(), [ e.latLng.lng, e.latLng.lat ]);
  }

};

module.exports = Point;
