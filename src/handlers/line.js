'use strict';

var extend = require('xtend');
var Handlers = require('./handlers');
var util = require('../util');
var DOM = util.DOM;

function Line(map) {
  this.type = 'LineString';
  this.initialize(map);
}

Line.prototype = extend(Handlers, {

  drawStart() {
    if (this._map) {
      this._data = [];
      this._enabled = true;

      this._map.on('mousemove', this._onMouseMove.bind(this));
      this._map.on('click', this._onClick.bind(this));
      this._map.on('move', this._onMove.bind(this));
    }
  },

  drawStop() {
    if (this._map) this._map.off('click', this._onClick);
  },

  _onClick(e) {
    var c = this._map.unproject([e.point.x, e.point.y]);
    var coords = [c.lng, c.lat];
    this._data.push(coords);
    this._addVertex(coords);
  },

  _onMouseMove(e) {
    if (this._data.length) {
      // Update the guide line
      this._currentPos = {x: e.point.x, y: e.point.y};
      this._updateGuide(this._currentPos);
    }
  },

  _addVertex(coords) {
    this.editCreate(coords);
    this._vertexCreate(coords, true);
  },

  _vertexCreate() {
    if (this._data.length >= 2) {
      this.drawCreate(this.type, this._data);
      this._clearGuides();
    }
  },

  _onMove() {
    if (this._data.length) this._updateGuide();
  },

  _updateGuide(pos) {
    var d = this._data;
    this._clearGuides();

    var a = d[d.length - 1];
    a = this._map.project([a[1], a[0]]);

    var b = pos || this._currentPos;

    // Draw guide line
    this._drawGuide(a, b);
  },

  _drawGuide(a, b) {
    var length = Math.floor(Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2)));
    var dashDistance = 10;

    if (!this._guidesContainer) {
      this._guidesContainer = DOM.create('div', 'mapboxgl-draw-guides', this._map.getContainer());
    }

    // Draw a dash every GuildeLineDistance
    for (var i = 0; i < length; i += dashDistance) {

      // Work out a fraction along line we are
      var fraction = i / length;

      // Calculate a new x,y point
      var x = Math.floor((a.x * (1 - fraction)) + (fraction * b.x));
      var y = Math.floor((a.y * (1 - fraction)) + (fraction * b.y));

      // Add guide dash to guide container
      var dash = DOM.create('div', 'mapboxgl-draw-guide-dash', this._guidesContainer);
      dash.style.top = y + 'px';
      dash.style.left = x + 'px';
    }
  },

  _clearGuides() {
    if (this._guidesContainer) {
      while (this._guidesContainer.firstChild) {
        this._guidesContainer.removeChild(this._guidesContainer.firstChild);
      }
    }
  }

});

module.exports = Line;
