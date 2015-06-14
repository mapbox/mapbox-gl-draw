'use strict';

var extend = require('xtend');
var vertices = require('./vertices');

function Line(map) {
  this.type = 'LineString';
  this.initialize(map);
}

Line.prototype = extend(vertices, {

  drawStart() {
    this._data = [];

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onMove = this._onMove.bind(this);

    this._map.on('mousemove', this._onMouseMove);
    this._map.on('click', this._onClick);
    this._map.on('move', this._onMove);
  },

  drawStop() {
    this.clearGuides();
    this.editDestroy();
    this._map.off('mousemove', this._onMouseMove);
    this._map.off('click', this._onClick);
    this._map.off('move', this._onMove);
  },

  _onClick(e) {
    var c = this._map.unproject(e.point);
    var coords = [c.lng, c.lat];

    this._map.featuresAt(e.point, {
      radius: 0
    }, (err, feature) => {
      if (err) throw err;

      // TODO complete a linestring if featuresAt returns the last point.
      console.log('featuresAt', feature);
      this._data.push(coords);
      this._addVertex(coords);
    });
  },

  _onMouseMove(e) {
    if (this._data.length) {
      // Update the guide line
      this._currentPos = {x: e.point.x, y: e.point.y};
      this._updateGuide(this._currentPos);
    }
  },

  _addVertex(coords) {
    this.editCreate('Point', coords);
    this._vertexCreate();
  },

  _vertexCreate() {
    if (this._data.length >= 2) {
      this.drawCreate(this.type, this._data);
    }

    this.clearGuides();
  },

  _onMove() {
    if (this._data.length) this._updateGuide();
  },

  _updateGuide(pos) {
    var d = this._data;
    this.clearGuides();

    var a = d[d.length - 1];
    a = this._map.project([a[1], a[0]]);

    var b = pos || this._currentPos;

    // Draw guide line
    this.drawGuide(this._map, a, b);
  }

});

module.exports = Line;
