'use strict';

let extend = require('xtend');
let handlers = require('./handlers');

function Point(map, options) {
  this.type = 'Point';
  this.initialize(map, options);
}

Point.prototype = extend(handlers, {

  drawStart() {
    this._onClick = this._onClick.bind(this);
    this._map.on('click', this._onClick);
  },

  drawStop() {
    this._map.off('click', this._onClick);
  },

  _onClick(e) {
    var c = this._map.unproject([e.point.x, e.point.y]);
    var coords = [c.lng, c.lat];
    this.drawCreate(this.type, coords);
    this.featureComplete();
  }

});

module.exports = Point;
