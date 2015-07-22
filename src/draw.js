'use strict';

var extend = require('xtend');
var Control = require('./control');
var themeStyle = require('./theme/style');
var themeEdit = require('./theme/edit');
var { DOM } = require('./util');

// Data store
var Store = require('./store');

// Control handlers
var Polygon = require('./handlers/polygon');
var Line = require('./handlers/line');
var Square = require('./handlers/square');
var Point = require('./handlers/point');

function Draw(options) {
  if (!(this instanceof Draw)) return new Draw(options);
  mapboxgl.util.setOptions(this, options);

  // event listeners
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
    this.options.geoJSON = new Store(this.options.geoJSON, map);

    // Build out draw controls
    if (controls.line) {
      this.lineStringCtrl = this._createButton({
        className: controlClass + ' line',
        title: `LineString tool ${this.options.keybindings && '(l)'}`,
        fn: this._drawLine.bind(this)
      });
    }

    if (controls.shape) {
      this.polygonCtrl = this._createButton({
        className: `${controlClass} shape`,
        title: `Polygon tool ${this.options.keybindings && '(p)'}`,
        fn: this._drawPolygon.bind(this)
      });
    }

    if (controls.square) {
      this.squareCtrl = this._createButton({
        className: `${controlClass} square`,
        title: `Square tool ${this.options.keybindings && '(s)'}`,
        fn: this._drawSquare.bind(this)
      });
    }

    if (controls.marker) {
      this.markerCtrl = this._createButton({
        className: `${controlClass} marker`,
        title: `Marker tool ${this.options.keybindings && '(m)'}`,
        fn: this._drawPoint.bind(this)
      });
    }

    if (this.options.keybindings) {
      map.getContainer().addEventListener('keyup', this.onKeyUp);
    }

    this._map = map;

    this._mapState();
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
      case 27: // (escape) exit draw/edit mode
        if (this._control && !this.editId) {
          this._control.completeDraw();
        } else if (this._control) {
          this._control.completeEdit();
          this._exitEdit();
        }
        break;
      case 68: // (d) delete the feature in edit mode
        if (this.editId) {
          this._destroy(this.editId);
        }
    }
  },

  _onClick(e) {
    this._map.featuresAt(e.point, { radius: 10 }, (err, features) => {
      if (err) throw err;
      else if (this._control) return;
      else if (!features.length && this.editId) return this._exitEdit();
      else if (!features.length) return;

      var feature = features[0];
      if (this.editId && this.editId !== feature.properties._drawid) this._exitEdit();
      else if (this.editId === feature.properties._drawid) return;

      this._edit(feature);
    });
  },

  _edit(feature) {
    this.editId = feature.properties._drawid;
    feature = this.options.geoJSON.edit(this.editId);
    var c = feature.geometry.coordinates;
    var featureType = feature.geometry.type;

    if (featureType === 'Point')
      this._control = new Point(this._map, this.options.geoJSON, feature);
    else if (featureType === 'LineString')
      this._control = new Line(this._map, this.options.geoJSON, feature);
    else if (c[0][0][0] === c[0][1][0])
      this._control = new Square(this._map, this.options.geoJSON, feature);
    else
      this._control = new Polygon(this._map, this.options.geoJSON, feature);

    this._map.getContainer().addEventListener('mousedown', this.initiateDrag, true);

    this.deleteBtn = this._createButton({
      className: '',
      title: `delete ${featureType}`,
      fn: this._destroy.bind(this, this.editId)
    });
  },

  _exitEdit(deleting) {
    DOM.destroy(this.deleteBtn);
    if (!deleting) this.options.geoJSON.save([ this._control.get() ]);
    this._map.getContainer().removeEventListener('mousedown', this.initiateDrag, true);
    this.editId = false;
    this._control = false;
  },

  _initiateDrag(e) {
    e.stopPropagation();
    var coords = DOM.mousePos(e, this._map._container);
    this._map.featuresAt([coords.x, coords.y], { radius: 10 }, (err, features) => {
      if (err) throw err;
      else if (!features.length) return this._exitEdit();
      else if (features[0].properties._drawid !== this.editId) return;

      this._map.getContainer().addEventListener('mousemove', this.drag, true);
      this._map.getContainer().addEventListener('mouseup', this.endDrag, true);
    });
  },

  _drag(e) {
    e.stopPropagation();
    if (!this.dragging) {
      this.dragging = true;
      this.init = DOM.mousePos(e, this._map.getContainer());
      this._map.getContainer().classList.add('mapboxgl-draw-move-activated');
    }
    var curr = DOM.mousePos(e, this._map.getContainer());
    this._control.translate(this.init, curr);
  },

  _endDrag() {
    this._map.getContainer().removeEventListener('mousemove', this.drag, true);
    this._map.getContainer().removeEventListener('mouseup', this.endDrag, true);
    this._map.getContainer().classList.remove('mapboxgl-draw-move-activated');
    this._control.translating = false;
    this.dragging = false;
  },

  _drawPolygon() {
    this._control = new Polygon(this._map, this.options.geoJSON);
    this._control.startDraw();
  },

  _drawLine() {
    this._control = new Line(this._map, this.options.geoJSON);
    this._control.startDraw();
  },

  _drawSquare() {
    this._control = new Square(this._map, this.options.geoJSON);
    this._control.startDraw();
  },

  _drawPoint() {
    this._control = new Point(this._map, this.options.geoJSON);
    this._control.startDraw();
  },

  _destroy(id) {
    this._control.store.clear(); // I don't like this
    this.options.geoJSON.unset(id);
    this._exitEdit(true);
    this.editId = false;
  },

  _createButton(opts) {
    var a = DOM.create('button', opts.className, this._container, {
      title: opts.title
    });

    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      var el = e.target;

      if (this._control) this._control.completeDraw();

      if (el.classList.contains('active')) {
        el.classList.remove('active');
      } else {
        DOM.removeClass(document.querySelectorAll('.' + this._controlClass), 'active');
        el.classList.add('active');
        opts.fn();
      }

    }, true);

    return a;
  },

  _mapState() {
    var controlClass = this._controlClass;

    this._map.on('load', () => {

      var drawLayer = new mapboxgl.GeoJSONSource({
        data: this.options.geoJSON.getAll()
      });

      this._map.addSource('draw', drawLayer);
      themeStyle.forEach((style) => {
        this._map.addLayer(style);
      });

      var editLayer = new mapboxgl.GeoJSONSource({
        data: []
      });

      this._map.addSource('edit', editLayer);
      themeEdit.forEach((style) => {
        this._map.addLayer(style);
      });

      this._map.on('draw.stop', () => {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        this._control = false;
      });

      this._map.on('edit.feature.update', (e) => {
        editLayer.setData(e.geojson);
      });

      this._map.on('draw.feature.update', (e) => {
        drawLayer.setData(e.geojson);
      });

      this._map.on('click', this._onClick.bind(this));

    });

  }
});

module.exports = Draw;
