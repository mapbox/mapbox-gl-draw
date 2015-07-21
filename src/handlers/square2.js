'use strict';

var Immutable = require('immutable');
var hat = require('hat');
var EditStore = require('../edit_store');

function Square(map, drawStore, data) {

  this._map = map;
  this.store = new EditStore(this._map);
  this.drawStore = drawStore;

  if (data) {
    this.coordinates = Immutable.List(data.geometry.coordinates);
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
  this.startDraw = this._startDraw.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

  this._map.getContainer().addEventListener('mousedown', this.startDraw, true);
}

Square.prototype = {

  _startDraw(e) {
    e.stopPropagation();
    this._map.getContainer().removeEventListener('mousedown', this.startDraw, true);
    this._map.getContainer().addEventListener('mousemove', this.onMouseMove, true);

    var c = this._map.unproject([e.x, e.y]);
    var i = 0;
    while (i++ < 5) {
      this.coordinates = this.coordinates.push([ c.lng, c.lat ]);
    }
  },

  _onMouseMove(e) {
    e.stopPropagation();

    if (!this.started) {
      this.started = true;
      this._map.getContainer().addEventListener('mouseup', this.completeDraw, true);
    }

    var c = this._map.unproject([e.x, e.y]);
    var orig = this.coordinates;
    this.coordinates = this.coordinates.set(1, [ orig.get(0)[0], c.lat ]);
    this.coordinates = this.coordinates.set(2, [ c.lng, c.lat ]);
    this.coordinates = this.coordinates.set(3, [ c.lng, orig.get(0)[1] ]);


    this.feature.geometry.coordinates = [ this.coordinates.toJS() ];
    this.store.update(this.feature);
  },

  _completeDraw() {
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove, true);
    this._map.getContainer().removeEventListener('mouseup', this.completeDraw, true);

    // render the changes
    this.store.clear();
    this.drawStore.set('Polygon', hat(), [ this.coordinates.toJS() ]);
  },

  startEdit() {},

  completeEdit() {}

};

module.exports = Square;
