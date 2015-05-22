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

    if (controls.shape) this._createButton(controlClass + ' shape', 'Shape tool', this._drawPolygon.bind(map));
    if (controls.line) this._createButton(controlClass + ' line', 'Line tool', this._drawLine.bind(map));
    if (controls.circle) this._createButton(controlClass + ' circle', 'Circle tool', this._drawCircle.bind(map));
    if (controls.square) this._createButton(controlClass + ' square', 'Rectangle tool', this._drawSquare.bind(map));
    if (controls.marker) this._createButton(controlClass + ' marker', 'Marker tool', this._drawPoint.bind(map));

    this._mapState(map);
    return container;
  },

  _drawPolygon() {
    // TODO should this._map, & this.options.polygon be passed?
    new Polygon(this);
  },

  _drawLine() {
    new Line(this);
  },

  _drawCircle() {
    new Circle(this);
  },

  _drawSquare() {
    new Square(this);
  },

  _drawPoint() {
    new Point(this);
  },

  _createButton(className, title, fn) {
    var a = DOM.create('button', className, this._container, {
      title: title
    });

    var controlClass = this._controlClass;
    var map = this._map;

    a.addEventListener('click', function(e) {
      e.preventDefault();

      // Cancel any initialized handlers
      map.fire('draw.cancel');

      if (this.classList.contains('active')) {
        this.classList.remove('active');
      } else {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        this.classList.add('active');
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

          theme.forEach(function(style) {
            map.addLayer(style);
          });
        }
      });

    });
  }
});

module.exports = Draw;
