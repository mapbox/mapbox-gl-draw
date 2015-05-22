'use strict';

let extend = require('xtend');
let Handlers = require('./handlers');

function Point(map) {
  var options = {
    repeatMode: true
  };

  this.type = 'Point';
  this.initialize(map, options);
}

Point.prototype = extend(Handlers, {

  drawStart() {
    if (this._map) {
      this._map.on('click', (e) => {
        this._onClick(e);
      });
    }
  },

  drawStop() {
    if (this._map) {
      this._map.off('click', this._onClick);
    }
  },

  _onClick(e) {
    var c = this._map.unproject([e.point.x, e.point.y]);
    var point = [c.lng, c.lat];
    this.create(this.type, point);
  }

});

module.exports = Point;
