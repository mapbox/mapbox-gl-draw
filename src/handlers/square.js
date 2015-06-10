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
      this._container = this._map.getContainer();
      this._enabled = true;
      this._container.addEventListener('mousedown', this._onMouseDown.bind(this), true);
      this._container.addEventListener('mouseup', this._onMouseUp.bind(this));
      this._map.on('mousemove', this._onMouseMove.bind(this));
    }
  },

  drawStop() {
    if (this._map) this._map.off('click', this._onClick);
  },

  _onMouseDown(e) {
    e.stopPropagation();
    if (!this._enabled) return;
    this._activated = true;
    this._start = DOM.mousePos(e, this._container);
    this._squareDiv = DOM.create('div', 'mapboxgl-draw-guide-square', this._container);
  },

  _onMouseMove(e) {
    if (!this._activated) return;
    var current = e.point;
    var box = this._squareDiv;

    var pos1 = this._map.unproject(this._start);
    var pos2 = this._map.unproject([this._start.x, current.y]);
    var pos3 = this._map.unproject(current);
    var pos4 = this._map.unproject([current.x, this._start.y]);

    this._data = [
      [pos1.lng, pos1.lat],
      [pos2.lng, pos2.lat],
      [pos3.lng, pos3.lat],
      [pos4.lng, pos4.lat],
      [pos1.lng, pos1.lat]
    ];

    var minX = Math.min(this._start.x, current.x);
    var maxX = Math.max(this._start.x, current.x);
    var minY = Math.min(this._start.y, current.y);
    var maxY = Math.max(this._start.y, current.y);

    DOM.setTransform(box, 'translate(' + minX + 'px,' + minY + 'px)');
    box.style.width = (maxX - minX) + 'px';
    box.style.height = (maxY - minY) + 'px';
  },

  _onMouseUp() {
    this._activated = false;
    this._squareDiv.parentNode.removeChild(this._squareDiv);
    this.drawCreate(this.type, [this._data]);
  }

});

module.exports = Square;
