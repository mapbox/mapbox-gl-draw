'use strict';

var xtend = require('xtend');
var Handler = require('./handlers');

/**
 * Point geometry object
 *
 * @param {Object} map - Instance of MpaboxGL Map
 * @param {Object} drawStore - The draw store for this session
 * @param {Object} data - GeoJSON polygon feature
 */
function Point(map, drawStore, data) {

  this.initialize(map, drawStore, 'Point', data);

  // event handler
  this.completeDraw = this._completeDraw.bind(this);
}

Point.prototype = xtend(Handler, {

  startDraw() {
    this._map.on('click', this.completeDraw);
  },

  _completeDraw(e) {
    this._map.off('click', this.completeDraw);
    this.feature = this.feature.setIn(['geometry', 'coordinates'], [ e.latLng.lng, e.latLng.lat ]);
    this.drawStore.set(this.feature.toJS());
  }

});

module.exports = Point;
