'use strict';

var extend = require('xtend');
var Control = require('./control');
var util = require('./util');
var DOM = util.DOM;

// Control handlers
var Shape = require('./handlers/shape');
var Line = require('./handlers/line');
var Circle = require('./handlers/circle');
var Square = require('./handlers/square');
var Marker = require('./handlers/marker');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = extend(Control, {
  options: {
    position: 'top-left',
    controls: {
      marker: true,
      line: true,
      shape: true,
      square: true,
      circle: true
    }
  },

  onAdd: function(map) {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    var controls = this.options.controls;

    if (controls.shape) this._createButton(controlClass + ' shape', 'Shape tool', this._drawShape.bind(map));
    if (controls.line) this._createButton(controlClass + ' line', 'Line tool', this._drawLine.bind(map));
    if (controls.circle) this._createButton(controlClass + ' circle', 'Circle tool', this._drawCircle.bind(map));
    if (controls.square) this._createButton(controlClass + ' square', 'Rectangle tool', this._drawSquare.bind(map));
    if (controls.marker) this._createButton(controlClass + ' marker', 'Marker tool', this._drawMarker.bind(map));
    return container;
  },

  _drawShape: function() {
    new Shape(this);
  },

  _drawLine: function() {
    new Line(this);
  },

  _drawCircle: function() {
    new Circle(this);
  },

  _drawSquare: function() {
    new Square(this);
  },

  _drawMarker: function() {
    new Marker(this);
  },

  _createButton: function(className, title, fn) {
    var a = DOM.create('button', className, this._container, {
      title: title
    });

    var controlClass = this._controlClass;
    a.addEventListener('click', function(e) {
      e.preventDefault();

      if (!this.classList.contains('active')) {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        this.classList.add('active');
        fn();
      }
    });

    return a;
  }
});
