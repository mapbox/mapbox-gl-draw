'use strict';

let extend = require('xtend');
let handlers = require('./handlers');

function Point(map, options, position) {
  this.type = 'Point';
  this.initialize(map, options);
  this.position = position;
  console.log(this.position);
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
  },

  move(pos) {
    console.log(pos.x, pos.y);
    var c = this._map.unproject([pos.x, pos.y]);
    var coords = [c.lng, c.lat];
    this.drawCreate(this.type, coords);
    this.featureComplete();
  }

});

module.exports = Point;
