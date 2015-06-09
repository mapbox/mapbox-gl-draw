'use strict';

let extend = require('xtend');
let Handlers = require('./handlers');

function Point(map) {
  this.type = 'Point';
  this.initialize(map);
}

Point.prototype = extend(Handlers, {

  drawStart() {
    if (this._map) this._map.on('click', this._onClick.bind(this));
    this._enabled = true;
  },

  drawStop() {
    if (this._map) this._enabled = false;
  },

  _onClick(e) {
    if (!this._enabled) return;
    var c = this._map.unproject([e.point.x, e.point.y]);
    var coords = [c.lng, c.lat];
    this.drawCreate(this.type, coords);
  }

});

module.exports = Point;
