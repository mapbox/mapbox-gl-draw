'use strict';

var extend = require('xtend');
var handlers = require('./handlers');
var util = require('../util');
var DOM = util.DOM;

function Rectangle(map) {
  this.type = 'Polygon';
  this.initialize(map);
}

Rectangle.prototype = extend(handlers, {

  drawStart() {
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);

    this._container = this._map.getContainer();
    this._container.addEventListener('mousedown', this._onMouseDown, true);
    this._container.addEventListener('mouseup', this._onMouseUp);
    this._container.addEventListener('mousemove', this._onMouseMove);
  },

  drawStop() {
    this._clearRectangleGuide();
    this._container.removeEventListener('mousedown', this._onMouseDown, true);
    this._container.removeEventListener('mouseup', this._onMouseUp);
    this._container.removeEventListener('mousemove', this._onMouseMove);
  },

  _onMouseDown(e) {
    e.stopPropagation();
    this._activated = true;
    this._start = DOM.mousePos(e, this._container);
    this._rectangleGuide = DOM.create('div', 'mapboxgl-draw-guide-rectangle', this._container);
  },

  _onMouseMove(e) {
    if (!this._activated) return;
    var current = DOM.mousePos(e, this._container);
    var box = this._rectangleGuide;

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

  _clearRectangleGuide() {
    if (this._rectangleGuide && this._rectangleGuide.parentNode) {
      this._rectangleGuide.parentNode.removeChild(this._rectangleGuide);
    }
  },

  _onMouseUp() {
    this._activated = false;
    this._clearRectangleGuide();
    if (this._data) this.drawCreate(this.type, [this._data]);
    this.featureComplete();
  }

});

module.exports = Rectangle;
