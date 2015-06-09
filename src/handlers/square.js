'use strict';

var extend = require('xtend');
var Handlers = require('./handlers');
var util = require('../util');
var DOM = util.DOM;

function Square(map) {
  this.type = 'Polygon';
  this.initialize(map);
}

Square.prototype = extend(Handlers, {

  drawStart() {
    if (this._map) {
      this._enabled = true;

      this._map.on('mousedown', this._onMouseDown.bind(this));
      this._map.on('mousemove', this._onMouseMove.bind(this));
      this._map.on('mouseUp', this._onMouseUp.bind(this));
      this._map.on('move', this._onMove.bind(this));
    }
  },

  drawStop() {
    if (this._map) this._map.off('click', this._onClick);
  },

  _onMouseDown(e) {
    if (!this._enabled) return;
    this._activated = true;
    this._start = e.point;
    this._squareDiv = DOM.create('div', 'mapboxgl-draw-guide-square', this._map.getContainer());
  },

  _onMouseMove(e) {
    if (!this._activated) return;
    var current = e.point;
    var box = this._squareDiv;

    var minX = Math.min(this._start.x, current.x);
    var maxX = Math.max(this._start.x, current.x);
    var minY = Math.min(this._start.y, current.y);
    var maxY = Math.max(this._start.y, current.y);

    DOM.setTransform(box, 'translate(' + minX + 'px,' + minY + 'px)');
    box.style.width = (maxX - minX) + 'px';
    box.style.height = (maxY - minY) + 'px';
  },

  _onMouseUp(e) {
    this._activated = false;
    this._squareDiv.parentNode.removeChild(this._squareDiv);
  },

  _onMove() {
    // if (this._data.length) this._updateGuide();
  }

});

module.exports = Square;
