'use strict';

var Control = require('./control');
var DOM = require('./dom');
var util = require('./util');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = util.inherit(Control, {
  options: {
    position: 'topleft'
  },

  onAdd: function(map) {
    var className = 'mapboxgl-ctrl-nav mapboxgl-ctrl-draw';
    var container = this._container = DOM.create('div', className, map.getContainer());

    this._shapeButton = this._createButton('mapboxgl-ctrl-draw-btn shape', this._drawShape.bind(map));
    this._circleButton = this._createButton('mapboxgl-ctrl-draw-btn circle', this._drawCircle.bind(map));
    this._markerButton = this._createButton('mapboxgl-ctrl-draw-btn marker', this._drawMarker.bind(map));

    return container;
  },

  _drawShape: function(map) {},

  _drawCircle: function(map) {},

  _drawMarker: function(map) {},

  _createButton: function(className, fn) {
    var a = DOM.create('button', className, this._container);
    a.addEventListener('click', function() { fn(); });
    return a;
  }
});
