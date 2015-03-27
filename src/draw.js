'use strict';

var extend = require('xtend');
var Control = require('./control');
var DOM = require('./dom');
var util = require('./util');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = extend(Control, {
  options: {
    position: 'top-left'
  },

  onAdd: function(map) {
    var className = 'mapboxgl-ctrl';
    var container = this._container = DOM.create('div', className + '-group', map.getContainer());
    this._shapeButton = this._createButton('mapboxgl-ctrl-draw-btn shape', 'Shape tool', this._drawShape.bind(map));
    this._lineButton = this._createButton('mapboxgl-ctrl-draw-btn line', 'Line tool', this._drawLine.bind(map));
    this._circleButton = this._createButton('mapboxgl-ctrl-draw-btn circle', 'Circle tool', this._drawCircle.bind(map));
    this._squareButton = this._createButton('mapboxgl-ctrl-draw-btn square', 'Rectangle tool', this._drawSquare.bind(map));
    this._markerButton = this._createButton('mapboxgl-ctrl-draw-btn marker', 'Marker tool', this._drawMarker.bind(map));
    return container;
  },

  _drawShape: function(map) {},
  _drawLine: function(map) {},
  _drawCircle: function(map) {},
  _drawSquare: function(map) {},
  _drawMarker: function(map) {},

  _createButton: function(className, title, fn) {
    var a = DOM.create('button', className, this._container, {title: title});
    a.addEventListener('click', function() { fn(); });
    return a;
  }
});
