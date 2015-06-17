'use strict';

var extend = require('xtend');
var mapboxgl = require('mapbox-gl');
var Control = require('./control');
var themeStyle = require('./theme/style');
var themeEdit = require('./theme/edit');
var util = require('./util');
var DOM = util.DOM;

// Data store
var Store = require('./store');

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
    keybindings: true,
    geoJSON: [],
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
    this.options.geoJSON = new Store(this.options.geoJSON);

    // Build out draw controls
    if (controls.line) {
      this.lineStringCtrl = this._createButton({
        className: controlClass + ' line',
        title: 'LineString tool' + (this.options.keybindings ? ' (l)' : ''),
        fn: this._drawLine.bind(this, map, this.options)
      });
    }

    if (controls.shape) {
      this.polygonCtrl = this._createButton({
        className: controlClass + ' shape',
        title: 'Polygon tool' + (this.options.keybindings ? ' (p)' : ''),
        fn: this._drawPolygon.bind(this, map, this.options)
      });
    }

    if (controls.square) {
      this.squareCtrl = this._createButton({
        className: controlClass + ' square',
        title: 'Square tool' + (this.options.keybindings ? ' (s)' : ''),
        fn: this._drawSquare.bind(this, map, this.options)
      });
    }

    if (controls.marker) {
      this.markerCtrl = this._createButton({
        className: controlClass + ' marker',
        title: 'Marker tool' + (this.options.keybindings ? ' (m)' : ''),
        fn: this._drawPoint.bind(this, map, this.options)
      });
    }

    map.getContainer().addEventListener('mousedown', this._onMouseDown, true);

    if (this.options.keybindings) {
      map.getContainer().addEventListener('keyup', this._onKeyUp.bind(this));
    }

    this._mapState(map);
    return container;
  },

  _onKeyUp(e) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent('click', true, false);
    switch (e.keyCode) {
      case 76: // (l) linestring
        if (!this.lineStringCtrl.classList.contains('active')) {
          this.lineStringCtrl.dispatchEvent(event);
        }
      break;
      case 77: // (m) marker
        if (!this.markerCtrl.classList.contains('active')) {
          this.markerCtrl.dispatchEvent(event);
        }
      break;
      case 80: // (p) polygon
        if (!this.polygonCtrl.classList.contains('active')) {
          this.polygonCtrl.dispatchEvent(event);
        }
      break;
      case 83: // (s) square
        if (!this.squareCtrl.classList.contains('active')) {
          this.squareCtrl.dispatchEvent(event);
        }
      break;
    }
  },

  _onMouseDown(e) {
    if (e.altKey) {
      e.stopPropagation();
      // TODO https://github.com/mapbox/mapbox-gl-js/issues/1264
      // this._captureFeatures();
    }
  },

  _drawPolygon(map, options) {
    this._control = new Polygon(map, options);
  },

  _drawLine(map, options) {
    this._control = new Line(map, options);
  },

  _drawSquare(map, options) {
    this._control = new Square(map, options);
  },

  _drawPoint(map, options) {
    this._control = new Point(map, options);
  },

  _createButton(opts) {
    var a = DOM.create('button', opts.className, this._container, {
      title: opts.title
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
        opts.fn();
      }
    });

    return a;
  },

  _mapState(map) {
    var controlClass = this._controlClass;

    map.on('load', () => {

      // Initialize the draw layer with any possible
      // features passed via `options.geoJSON`
      var drawLayer = new mapboxgl.GeoJSONSource({
        data: this.options.geoJSON.getAll()
      });

      map.addSource('draw', drawLayer);
      themeStyle.forEach((style) => {
        map.addLayer(style);
      });

      // Initialize an editLayer that provides
      // marker anchors and guides during the
      // draw process.
      var editLayer = new mapboxgl.GeoJSONSource({
        data: []
      });

      map.addSource('edit', editLayer);
      themeEdit.forEach((style) => {
        map.addLayer(style);
      });

      map.on('draw.stop', () => {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
      });

      map.on('edit.feature.update', (e) => {
        editLayer.setData(e.geojson);
      });

      map.on('draw.feature.update', (e) => {
        drawLayer.setData(e.geojson);
      });
    });
  }
});

module.exports = Draw;
