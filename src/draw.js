'use strict';

let extend = require('xtend');
let Control = require('./control');
let theme = require('./theme');
let util = require('./util');
let DOM = util.DOM;

// Control handlers
let Polygon = require('./handlers/polygon');
let Line = require('./handlers/line');
let Circle = require('./handlers/circle');
let Square = require('./handlers/square');
let Point = require('./handlers/point');

function Draw(options) {
  if (!(this instanceof Draw)) return new Draw(options);
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

  onAdd(map) {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    var controls = this.options.controls;

    if (controls.shape) this._createButton(controlClass + ' shape', 'Shape tool', this._drawPolygon.bind(this, map));
    if (controls.line) this._createButton(controlClass + ' line', 'Line tool', this._drawLine.bind(this, map));
    if (controls.circle) this._createButton(controlClass + ' circle', 'Circle tool', this._drawCircle.bind(this, map));
    if (controls.square) this._createButton(controlClass + ' square', 'Rectangle tool', this._drawSquare.bind(this, map));
    if (controls.marker) this._createButton(controlClass + ' marker', 'Marker tool', this._drawPoint.bind(this, map));

    this._mapState(map);
    return container;
  },

  _drawPolygon(map) {
    this._control = new Polygon(map);
  },

  _drawLine(map) {
    this._control = new Line(map);
  },

  _drawCircle(map) {
    this._control = new Circle(map);
  },

  _drawSquare(map) {
    this._control = new Square(map);
  },

  _drawPoint(map) {
    this._control = new Point(map);
  },

  _createButton(className, title, fn) {
    var a = DOM.create('button', className, this._container, {
      title: title
    });

    var controlClass = this._controlClass;

    a.addEventListener('click', (e) => {
      e.preventDefault();
      var el = e.target;

      if (el.classList.contains('active')) {
        if (this._control) this._control.disable();
        el.classList.remove('active');
      } else {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        if (this._control) this._control.disable();
        el.classList.add('active');
        fn();
      }
    });

    return a;
  },

  _mapState(map) {
    var drawLayer;
    var controlClass = this._controlClass;

    map.on('load', () => {

      map.on('draw.stop', () => {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
      });

      map.on('draw.feature.created', (e) => {
        if (drawLayer) {
          drawLayer.setData(e.geojson);
        } else {
          drawLayer = new mapboxgl.GeoJSONSource({
            data: e.geojson
          });

          map.addSource('draw', drawLayer);

          theme.forEach((style) => {
            map.addLayer(style);
          });
        }
      });

    });
  }
});

module.exports = Draw;
