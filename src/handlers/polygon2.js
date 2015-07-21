'use strict';

var Immutable = require('immutable');
var hat = require('hat');
var EditStore = require('../edit_store');

function Polygon(map, drawStore, data) {

  this._map = map;
  this.store = new EditStore(this._map);
  this.drawStore = drawStore;

  if (data) {
    this.coodinates = Immutable.List(data.geometry.coordinates);
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

  // event handlers
  this.addVertex = this._addVertex.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

}

Polygon.prototype = {

  startDraw() {
    this._map.on('click', this.addVertex);
    this._map.on('dblclick', this.completeDraw);
  },

  _addVertex(e) {
    var p = [ e.latLng.lng, e.latLng.lat ];

    if (this.editting) {
      this.coordinates = this.coordinates.splice(-1, 0, p);
    } else {
      this.editting = true;
      this.coordinates = Immutable.List([ p, p ]);
      this._map.getContainer().addEventListener('mousemove', this.onMouseMove);
    }

    this.feature.geometry.coordinates = [ this.coordinates.toJS() ];
    this.store.update(this.feature);
  },

  _onMouseMove(e) {
    var coords = this._map.unproject([e.x, e.y]);
    var c = this.coordinates;
    c = c.splice(-1, 0, [ coords.lng, coords.lat ]);
    this.feature.geometry.coordinates = [ c.toJS() ];
    this.store.update(this.feature);
  },

  _completeDraw() {
    this._map.off('click', this.addVertex);
    this._map.off('dblclick', this.completeDraw);
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove);

    // render the changes
    this.store.clear();
    this.drawStore.set('Polygon', hat(), [ this.coordinates.toJS() ]);
  },

  startEdit() {},

  completeEdit() {}
};

module.exports = Polygon;
