'use strict';

var Immutable = require('immutable');
var hat = require('hat');
var EditStore = require('../edit_store');
var { translate } = require('../util');

/**
 * Square geometry object
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @param {Object} drawStore - The overall drawStore for this session
 * @param {Object} data - GeoJSON polygon feature
 */
function Square(map, drawStore, data) {

  this._map = map;
  this.drawStore = drawStore;
  this.coordinates = Immutable.List(data ? data.geometry.coordinates[0] : []);

  this.feature = Immutable.Map({
    type: 'Feature',
    properties: {
      _drawid: data ? data.properties._drawid : hat()
    },
    geometry: {
      type: 'Polygon',
      coordinates: [ this.coordinates.toJS() ]
    }
  });

  this.store = new EditStore(this._map, [ this.feature.toJS() ]);

  // event handlers
  this.onMouseDown = this._onMouseDown.bind(this);
  this.onMouseMove = this._onMouseMove.bind(this);
  this.completeDraw = this._completeDraw.bind(this);

}

Square.prototype = {

  startDraw() {
    this._map.getContainer().addEventListener('mousedown', this.onMouseDown, true);
  },

  _onMouseDown(e) {
    this._map.getContainer().removeEventListener('mousedown', this.onMouseDown, true);
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


    var geom = this.feature.get('geometry');
    geom.coordinates = [ this.coordinates.toJS() ];
    this.feature.set('geometry', geom);
    this.store.update(this.feature.toJS());
  },

  _completeDraw() {
    this._map.getContainer().removeEventListener('mousemove', this.onMouseMove, true);
    this._map.getContainer().removeEventListener('mouseup', this.completeDraw, true);

    // render the changes
    this.store.clear();
    this.drawStore.set('Polygon', hat(), [ this.coordinates.toJS() ]);
  },

  startEdit() {},

  translate(init, curr) {
    if (this.translating) {
      console.log(JSON.stringify(this.initGeom, null, 2));
      this.store.update(this.feature.toJS());
    } else {
      this.translating = true;
      this.initGeom = Immutable.fromJS(this.feature.toJS());
    }
    this.feature = Immutable.Map(translate(this.initGeom.toJS(), init, curr, this._map));
  },

  completeEdit() {
    this.store.clear();
    this.drawStore.set('Polygon', hat(), [ this.coordinate ]);
  },

  get() {
    return this.feature.toJS();
  }
};

module.exports = Square;
