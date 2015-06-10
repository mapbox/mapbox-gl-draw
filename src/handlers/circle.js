'use strict';

var extend = require('xtend');
var Handlers = require('./handlers');

function Circle(map) {
  this.type = 'Polygon';
  this.initialize(map);
}

Circle.prototype = extend(Handlers, {

  drawStart() {},

  drawStop() {},

  _onClick() {}

});

module.exports = Circle;
