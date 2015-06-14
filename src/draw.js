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
var Rectangle = require('./handlers/rectangle');
var Point = require('./handlers/point');

function Draw(options) {
  if (!(this instanceof Draw)) return new Draw(options);
  util.setOptions(this, options);
}

Draw.prototype = extend(Control, {
  options: {
    position: 'top-left',
    keybindings: true,
    controls: {
      marker: true,
      line: true,
      shape: true,
      rectangle: true
    }
  },

  onAdd(map) {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    var controls = this.options.controls;

    // Build out draw controls
    if (controls.line) {
      this.lineCtrl = this._createButton({
        className: controlClass + ' line',
        title: 'Line tool' + (this.options.keybindings ? ' (l)' : ''),
        fn: this._drawLine.bind(this, map)
      });
    }

    if (controls.shape) {
      this.shapeCtrl = this._createButton({
        className: controlClass + ' shape',
        title: 'Shape tool' + (this.options.keybindings ? ' (s)' : ''),
        fn: this._drawPolygon.bind(this, map)
      });
    }

    if (controls.rectangle) {
      this.rectangleCtrl = this._createButton({
        className: controlClass + ' square',
        title: 'Rectangle tool' + (this.options.keybindings ? ' (r)' : ''),
        fn: this._drawRectangle.bind(this, map)
      });
    }

    if (controls.marker) {
      this.markerCtrl = this._createButton({
        className: controlClass + ' marker',
        title: 'Marker tool' + (this.options.keybindings ? ' (m)' : ''),
        fn: this._drawPoint.bind(this, map)
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
      this.lineCtrl.dispatchEvent(event);
      break;
      case 77: // (m) marker
      this.markerCtrl.dispatchEvent(event);
      break;
      case 82: // (r) rectangle
      this.rectangleCtrl.dispatchEvent(event);
      break;
      case 83: // (s) shape
      this.shapeCtrl.dispatchEvent(event);
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

  _drawPolygon(map) {
    this._control = new Polygon(map);
  },

  _drawLine(map) {
    this._control = new Line(map);
  },

  _drawRectangle(map) {
    this._control = new Rectangle(map);
  },

  _drawPoint(map) {
    this._control = new Point(map);
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
