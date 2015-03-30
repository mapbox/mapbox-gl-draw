'use strict';

var extend = require('xtend');
var Line = require('./line');

module.exports = Polygon;

function Polygon(map) {
  var options = {
    repeatMode: true
  };

  this.type = 'Polygon';
  this.initialize(map, options);
}

Polygon.prototype = extend(Line, {

  drawStart: function() {},

  drawStop: function() {},

  _onClick: function(e) {}

});
