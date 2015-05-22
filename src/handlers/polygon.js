'use strict';

let extend = require('xtend');
let Line = require('./line');

function Polygon(map) {
  var options = {
    repeatMode: true
  };

  this.type = 'Polygon';
  this.initialize(map, options);
}

Polygon.prototype = extend(Line, {

  drawStart() {},

  drawStop() {},

  _onClick(e) {}

});

module.exports = Polygon;
