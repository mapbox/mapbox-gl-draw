'use strict';

var extend = require('xtend');
var Handlers = require('./handlers');

module.exports = Point;

function Point(map) {
  var options = {
    repeatMode: true
  };

  this.type = 'Point';
  this.initialize(map, options);
}

Point.prototype = extend(Handlers, {

  drawStart: function() {
    if (this._map) {
      this._map.on('click', function(e) {
        this._onClick(e);
      }.bind(this));
    }
  },

  drawStop: function() {
    if (this._map) {
      this._map.off('click', this._onClick);
    }
  },

  _onClick: function(e) {
    var c = this._map.unproject([e.point.x, e.point.y]);
    var point = [c.lng, c.lat];
    this.create(this.type, point);
  }

});
