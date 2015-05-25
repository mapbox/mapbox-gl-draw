'use strict';

let extend = require('xtend');
let Line = require('./line');

function Polygon(map) {
  this.type = 'Polygon';
  this.initialize(map, options);
}

Polygon.prototype = extend(Line, {

  drawStart() {},

  drawStop() {},

  _onClick() {}

});

module.exports = Polygon;
