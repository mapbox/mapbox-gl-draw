'use strict';

var extend = require('xtend');
var Line = require('./line');

function Polygon(map) {
  this.type = 'Polygon';
  this.initialize(map);
}

Polygon.prototype = extend(Line, {

  drawStart() {},

  drawStop() {},

  _onClick() {}

});

module.exports = Polygon;
