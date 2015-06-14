'use strict';

var extend = require('xtend');
var Control = require('./control');
var themeStyle = require('./theme/style');
var themeEdit = require('./theme/edit');
var util = require('./util');
var DOM = util.DOM;

// Control handlers
var Polygon = require('./handlers/polygon');
var Line = require('./handlers/line');
var Square = require('./handlers/square');
var Point = require('./handlers/point');

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
      square: true
    }
  },

  onAdd(map) {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    var controls = this.options.controls;

    if (controls.line) this._createButton(controlClass + ' line', 'Line tool', this._drawLine.bind(this, map));
    if (controls.shape) this._createButton(controlClass + ' shape', 'Shape tool', this._drawPolygon.bind(this, map));
    if (controls.square) this._createButton(controlClass + ' square', 'Rectangle tool', this._drawSquare.bind(this, map));
    if (controls.marker) this._createButton(controlClass + ' marker', 'Marker tool', this._drawPoint.bind(this, map));

    map.getContainer().addEventListener('mousedown', this._onMouseDown, true);

    this._mapState(map);
    return container;
  },

  _onMouseDown(e) {
    if (e.altKey) {
      e.stopPropagation();
      // TODO https://github.com/mapbox/mapbox-gl-js/issues/1264
      // this._captureFeatures();
    }
  },

  _drawPolygon(map) {
    this._control = new Polygon(map);
  },

  _drawLine(map) {
    this._control = new Line(map);
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
      e.stopPropagation();

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
    var drawLayer, editLayer;
    var controlClass = this._controlClass;

    map.on('load', () => {

      map.on('draw.stop', () => {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
      });

      map.on('edit.feature.update', (e) => {
        if (editLayer) {
          editLayer.setData(e.geojson);
        } else {
          editLayer = new mapboxgl.GeoJSONSource({
            data: e.geojson
          });
          map.addSource('edit', editLayer);
          themeEdit.forEach((style) => {
            map.addLayer(style);
          });
        }
      });

      map.on('draw.feature.update', (e) => {
        if (drawLayer) {
          drawLayer.setData(e.geojson);
        } else {
          drawLayer = new mapboxgl.GeoJSONSource({
            data: e.geojson
          });
          map.addSource('draw', drawLayer);
          themeStyle.forEach((style) => {
            map.addLayer(style);
          });
        }
      });

    });
  }
});

module.exports = Draw;
