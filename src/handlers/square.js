'use strict';

var extend = require('xtend');
var handlers = require('./handlers');
var util = require('../util');
var DOM = util.DOM;

function Square(map, options) {
  this.type = 'Polygon';
  this.initialize(map, options);
}

Square.prototype = extend(handlers, {

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
    this._clearSquareGuide();
    this._container.removeEventListener('mousedown', this._onMouseDown, true);
    this._container.removeEventListener('mouseup', this._onMouseUp);
    this._container.removeEventListener('mousemove', this._onMouseMove);
  },

  _onMouseDown(e) {
    e.stopPropagation();
    this._activated = true;
    this._start = DOM.mousePos(e, this._container);
    this._squareGuide = DOM.create('div', 'mapboxgl-draw-guide-square', this._container);
  },

  _onMouseMove(e) {
    if (!this._activated) return;
    var current = DOM.mousePos(e, this._container);
    var box = this._squareGuide;

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

  _clearSquareGuide() {
    if (this._squareGuide && this._squareGuide.parentNode) {
      this._squareGuide.parentNode.removeChild(this._squareGuide);
    }
  },

  _onMouseUp() {
    this._activated = false;
    this._clearSquareGuide();
    if (this._data) this.drawCreate(this.type, [this._data]);
    this.featureComplete();
  },

  translate(id, prev, pos) {
    var square = this._drawStore.getById(id);
    var dx = pos.x - prev.x;
    var dy = pos.y - prev.y;
    var coords = square.geometry.coordinates[0].map(coord => {
      var c = this._map.project(coord);
      c = this._map.unproject([c.x + dx, c.y + dy]);
      return [c.lng, c.lat];
    });
    square = {
      type: 'Feature',
      properties: {
        _drawid: id
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };
    this._drawStore.update(id, square);
    this._map.fire('draw.feature.update', {
      geojson: this._drawStore.getAll()
    });
  }

});

module.exports = Square;
