'use strict';

let extend = require('xtend');
let Handlers = require('./handlers');

function Point(map) {
  this.type = 'Point';
  this.initialize(map);
}

Point.prototype = extend(Handlers, {

  drawStart() {
    if (this._map) {
      this._map.on('click', (e) => {
        this._onClick(e);
      });
    }

    this._enabled = true;
  },

  drawStop() {
    if (this._map) this._enabled = false;
  },

  _onClick(e) {
    if (this._enabled) {
      var c = this._map.unproject([e.point.x, e.point.y]);
      var point = [c.lng, c.lat];
      this.create(this.type, point);
    }
  }

});

module.exports = Point;
