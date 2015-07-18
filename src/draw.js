'use strict';

var extend = require('xtend');
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

  this.onClick = this._onClick.bind(this);
  this.onMouseDown = this._onMouseDown.bind(this);
  this.onKeyUp = this._onKeyUp.bind(this);

  this.initiateDrag = this._initiateDrag.bind(this);
  this.endDrag = this._endDrag.bind(this);
  this.drag = this._drag.bind(this);

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
        fn: this._drawLine.bind(this)
      });
    }

    if (controls.shape) {
      this.polygonCtrl = this._createButton({
        className: controlClass + ' shape',
        title: 'Polygon tool' + (this.options.keybindings ? ' (p)' : ''),
        fn: this._drawPolygon.bind(this)
      });
    }

    if (controls.square) {
      this.squareCtrl = this._createButton({
        className: controlClass + ' square',
        title: 'Square tool' + (this.options.keybindings ? ' (s)' : ''),
        fn: this._drawSquare.bind(this)
      });
    }

    if (controls.marker) {
      this.markerCtrl = this._createButton({
        className: controlClass + ' marker',
        title: 'Marker tool' + (this.options.keybindings ? ' (m)' : ''),
        fn: this._drawPoint.bind(this)
      });
    }

    map.getContainer().addEventListener('click', this.onClick, true);

    map.getContainer().addEventListener('mousedown', this.onMouseDown, true);

    if (this.options.keybindings) {
      map.getContainer().addEventListener('keyup', this.onKeyUp);
    }


    this._map = map;

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

  _onMouseDown(/*e*/) {
    //if (e.altKey) {
    //  e.stopPropagation();
    //    TODO https://github.com/mapbox/mapbox-gl-js/issues/1264
    //    this._captureFeatures();
    //}
  },

  _onClick(e) {
    var coords = DOM.mousePos(e, this._map._container);
    this._map.featuresAt([coords.x, coords.y], { radius: 20 }, (err, features) => {
      if (err) {
        return;
      } else if (!features.length && this.editId) {
        this._exitEdit();
        this.editId = false;
        return;
      } else if (!features.length) {
        return;
      }

      var feature = features[0];
      this.editId = feature.properties._drawid;
      coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Point')
        this.featureType = 'point';
      else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')
        this.featureType = 'line';
      else if (coords[0][0][0] === coords[0][1][0])
        this.featureType = 'square';
      else
        this.featureType = 'polygon';

      this._edit();
    });
  },

  _edit() {
    this._map.getContainer().addEventListener('mousedown', this.initiateDrag, true);
  },

  _exitEdit() {
    this._map.getContainer().removeEventListener('mousedown', this.initiateDrag, true);
  },

  _initiateDrag() {
    this._map.getContainer().addEventListener('mousemove', this.drag, true);
    this._map.getContainer().addEventListener('mouseup', this.endDrag, true);
  },

  _drag(e) {
    e.stopPropagation();
    if (!this.dragging) {
      this.dragging = true;
      switch (this.featureType) {
        case 'point':
          this._control = new Point(this._map, this.options);
          break;
        case 'line':
          this._control = new Line(this._map, this.options);
          break;
        case 'square':
          this._control = new Square(this._map, this.options);
          break;
        case 'polygon':
          this._control = new Polygon(this._map, this.options);
          break;
      }
    }
    this.prev = this.pos || DOM.mousePos(e, this._map.getContainer());
    this.pos = DOM.mousePos(e, this._map.getContainer());
    this._control.translate(this.editId, this.prev, this.pos);
  },

  _endDrag() {
    this._map.getContainer().removeEventListener('mousemove', this.drag, true);
    this._map.getContainer().removeEventListener('mouseup', this.endDrag, true);
    this.dragging = false;
    this._control.disable();
  },

  _drawPolygon() {
    this._control = new Polygon(this._map, this.options);
  },

  _drawLine() {
    this._control = new Line(this._map, this.options);
  },

  _drawSquare() {
    this._control = new Square(this._map, this.options);
  },

  _drawPoint() {
    this._control = new Point(this._map, this.options);
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
