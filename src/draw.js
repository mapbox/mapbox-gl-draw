'use strict';

import R from 'ramda';
import { DOM } from './util';
import mapboxgl from 'mapbox-gl';
import themeEdit from './theme/edit';
import themeStyle from './theme/style';
import { LatLng, LatLngBounds } from 'mapbox-gl';

// Data store
import Store from './store';

// Control handlers
import Line from './geometries/line';
import Point from './geometries/point';
import Square from './geometries/square';
import Polygon from './geometries/polygon';

export default class Draw extends mapboxgl.Control {

  constructor(options) {
    super();

    this.options = {
      position: 'top-left',
      keybindings: true,
      geoJSON: [],
      controls: {
        marker: true,
        line: true,
        shape: true,
        square: true
      }
    };

    mapboxgl.util.setOptions(this, options);

    // event listeners
    this.drag = this._drag.bind(this);
    this.onClick = this._onClick.bind(this);
    this.onKeyUp = this._onKeyUp.bind(this);
    this.endDrag = this._endDrag.bind(this);
    this.initiateDrag = this._initiateDrag.bind(this);


    this.onKeyDown = this._onKeyDown.bind(this);
    this.onMouseDown = this._onMouseDown.bind(this);
    this.onMouseUp = this._onMouseUp.bind(this);
  }

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
        fn: this._drawLine.bind(this),
        id: 'lineDrawBtn'
      });
    }

    if (controls.shape) {
      this.polygonCtrl = this._createButton({
        className: `${controlClass} shape`,
        title: `Polygon tool ${this.options.keybindings && '(p)'}`,
        fn: this._drawPolygon.bind(this),
        id: 'polygonDrawBtn'
      });
    }

    if (controls.square) {
      this.squareCtrl = this._createButton({
        className: `${controlClass} square`,
        title: `Square tool ${this.options.keybindings && '(s)'}`,
        fn: this._drawSquare.bind(this),
        id: 'squareDrawBtn'
      });
    }

    if (controls.marker) {
      this.markerCtrl = this._createButton({
        className: `${controlClass} marker`,
        title: `Marker tool ${this.options.keybindings && '(m)'}`,
        fn: this._drawPoint.bind(this),
        id: 'pointDrawBtn'
      });
    }

    if (this.options.keybindings) {
      map.getContainer().addEventListener('keyup', this.onKeyUp);
    }

    map.getContainer().addEventListener('keydown', this.onKeyDown);

    this._map = map;

    this._mapState();
    return container;
  }

  _onKeyDown(e) {
    if (e.keyCode === 16) {
      this.shiftDown = true;
    }
  }

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
        this._finish();
        break;
      case 68: // (d) delete the feature in edit mode
        if (this.editId) {
          this._destroy(this.editId);
        }
    }
    if (e.keyCode === 16) {
      this.shiftDown = false;
    }
  }

  _onMouseDown(e) {
    if (!this.shiftDown) return;
    this.featInStart = DOM.mousePos(e, this._map.getContainer());
  }

  _onMouseUp(e) {
    if (!this.shiftDown) return;
    var end = DOM.mousePos(e, this._map.getContainer());

    var ne = this.featInStart.x > end.x ? this.featInStart : end;
    var sw = this.featInStart.x > end.x ? end : this.featInStart;

    ne = this._map.unproject(ne);
    sw = this._map.unproject(sw);

    var bounds = new LatLngBounds(
      new LatLng(sw.lat, sw.lng),
      new LatLng(ne.lat, ne.lng)
    );
    var feats = this.options.geoJSON.getFeaturesIn(bounds);
    console.log(feats);
  }

  /**
   * Handles clicks on the maps in a number of scenarios
   * @param {Object} e - the object passed to the callback of map.on('click', ...)
   * @private
   */
  _onClick(e) {

    this._map.featuresAt(e.point, {
      radius: 10,
      includeGeometry: true,
      layer: 'gl-draw-polygons'
    }, (err, features) => {
      if (err) throw err;

      if (features.length) { // clicked on a feature
        if (this._control && !this.editId) { // clicked on a feature while in draw mode
          return;
        } else if (this._control && this.editId) { // clicked on a feature while in edit mode
          if (features[0].properties.drawId === this.editId) { // clicked on the feature you're editing
            return;
          } else { // clicked on a different feature while in edit mode
            this._control.completeEdit();
          }
        }
      } else { // clicked not on a feature
        if (!this._control && !this.editId) { // click outside features while not drawing or editing
          return;
        } else if (this._control && !this.editId) { // clicked outside features while drawing
          return;
        } else if (this._control && this.editId) { // clicked outside features while editing
          return this._control.completeEdit();
        }
      }

      // if (clicked on a feature && ((!editing this feature && !drawing))
      this._edit(features[0]);
    });

  }

  _edit(feature) {
    if (!feature.properties.drawId) return; // for when null geometries are returned

    this.editId = feature.properties.drawId;
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
      className: 'mapboxgl-ctrl-draw-btn trash',
      title: `delete ${featureType}`,
      fn: this._destroy.bind(this, this.editId),
      id: 'deleteBtn'
    });
  }

  _finish() {
    if (this._control && this.editId) { // edit mode
      this._control.completeEdit();
    } else if (this._control) {
      this._control.completeDraw(); // draw mode
    }
  }

  _exitEdit() {
    DOM.destroy(this.deleteBtn);
    this._map.getContainer().removeEventListener('mousedown', this.initiateDrag, true);
    this.editId = false;
    this._control = false;
  }

  _initiateDrag(e) {
    var coords = DOM.mousePos(e, this._map._container);

    this._map.featuresAt([coords.x, coords.y], { radius: 20, includeGeometry: true }, (err, features) => {

      if (err) throw err;
      else if (!features.length) return;
      else if (R.none(feat => feat.properties.drawId === this.editId)(features)) return;

      e.stopPropagation();

      if (features.length > 1) {
        this.vertex = R.find(feat => feat.properties.meta === 'vertex')(features);
        this.newVertex = R.find(feat => feat.properties.meta === 'midpoint')(features);
      }

      if (this.newVertex) {
        this._control.editAddVertex(coords, this.newVertex.properties.index);
        this.vertex = this.newVertex;
      }

      this._map.getContainer().addEventListener('mousemove', this.drag, true);
      this._map.getContainer().addEventListener('mouseup', this.endDrag, true);

    });
  }

  _drag(e) {
    e.stopPropagation();

    if (!this.dragging) {
      this.dragging = true;
      this.init = DOM.mousePos(e, this._map.getContainer());
      this._map.getContainer().classList.add('mapboxgl-draw-move-activated');
    }

    var curr = DOM.mousePos(e, this._map.getContainer());

    if (this.vertex) {
      this._control.moveVertex(this.init, curr, this.vertex.properties.index);
    } else {
      this._control.translate(this.init, curr);
    }
  }

  _endDrag() {
    this._map.getContainer().removeEventListener('mousemove', this.drag, true);
    this._map.getContainer().removeEventListener('mouseup', this.endDrag, true);
    this._map.getContainer().classList.remove('mapboxgl-draw-move-activated');

    this._control.translating = false;
    this.dragging = false;

    if (this.vertex) {
      this.vertex = false;
      this._control.movingVertex = false;
    }
  }

  _drawPolygon() {
    this._finish();
    this._control = new Polygon(this._map, this.options.geoJSON);
    this._control.startDraw();
  }

  _drawLine() {
    this._finish();
    this._control = new Line(this._map, this.options.geoJSON);
    this._control.startDraw();
  }

  _drawSquare() {
    this._finish();
    this._control = new Square(this._map, this.options.geoJSON);
    this._control.startDraw();
  }

  _drawPoint() {
    this._finish();
    this._control = new Point(this._map, this.options.geoJSON);
    this._control.startDraw();
  }

  _destroy(id) {
    this._control.store.clear();
    this.options.geoJSON.unset(id);
    this._exitEdit();
  }

  _createButton(opts) {
    var attr = { title: opts.title };
    if (opts.id) {
      attr.id = opts.id;
    }
    var a = DOM.create('button', opts.className, this._container, attr);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      var el = e.target;

      if (this._control && !this.editId) this._control.completeDraw();

      if (el.classList.contains('active')) {
        el.classList.remove('active');
      } else {
        DOM.removeClass(document.querySelectorAll('.' + this._controlClass), 'active');
        el.classList.add('active');
        opts.fn();
      }

    }, true);

    return a;
  }

  _mapState() {
    var controlClass = this._controlClass;

    this._map.on('load', () => {

      this._map.addSource('draw', {
        data: this.options.geoJSON.getAll(),
        type: 'geojson'
      });

      themeStyle.forEach((style) => {
        this._map.addLayer(style);
      });

      this._map.addSource('edit', {
        data: {
          type: 'FeatureCollection',
          features: []
        },
        type: 'geojson'
      });

      themeEdit.forEach(style => {
        this._map.addLayer(style);
      });

      this._map.on('draw.end', () => {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        this._control = false;
      });

      this._map.on('edit.end', this._exitEdit.bind(this));

      this._map.on('edit.feature.update', e => {
        this._map.getSource('edit').setData(e.geojson);
      });

      this._map.on('draw.feature.update', e => {
        this._map.getSource('draw').setData(e.geojson);
      });

      this._map.on('click', this.onClick);

      this._map.on('mousemove', e => {
        //////////////////////////////////////////////////////////////////////
        //////////// FIX THIS WHEN MULTIPLE LAYER QUERIES LAND ///////////////
        //////////////////////////////////////////////////////////////////////
        this._map.featuresAt(e.point, { radius: 7, layer: 'gl-edit-points' }, (err, features) => {
          if (err) throw err;
          if (!features.length) return this._map.getContainer().classList.remove('mapboxgl-draw-move-activated');

          var vertex = R.find(feat => feat.properties.meta === 'vertex')(features);
          var midpoint = R.find(feat => feat.properties.meta === 'midPoint')(features);

          if (vertex || midpoint) {
            this._map.getContainer().classList.add('mapboxgl-draw-move-activated');
            this.hoveringOnVertex = true;
          }
        });
      });

      this._map.getContainer().addEventListener('mousedown', this.onMouseDown);
      this._map.getContainer().addEventListener('mouseup', this.onMouseUp);
    });

  }

  /***************/
  /* API Methods */
  /***************/

  /**
   * add a geometry
   *
   * @param {Object} feature - GeoJSON feature
   */
  addGeometry(feature) {
    this.options.geoJSON.set(feature);
  }

  /**
   * remove a geometry by its draw id
   *
   * @param {String} id - the drawid of the geometry
   */
  removeGeometry(id) {
    this.options.geoJSON.unset(id);
  }

  /**
   * add a feature collection (removes all currently draw features)
   *
   * @param {Object} featureCollection - a GeoJSON FeatureCollection
   */
  update(featureCollection) {
    this.options.geoJSON.clear();
    var feats = featureCollection.features;
    for (var i = 0, ii = feats.length; i < ii; i++) {
      this.options.geoJSON.set(feats[i]);
    }
  }

  /**
   * get a geometry by its draw id
   *
   * @param {String} id - the draw id of the geometry
   */
  get(id) {
    return this.options.geoJSON.get(id);
  }

  /**
   * get all draw geometries
   *
   * @returns {Object} a GeoJSON feature collection
   */
  getAll() {
    return this.options.geoJSON.getAll();
  }

  /**
   * remove all geometries
   */
  clear() {
    this.options.geoJSON.clear();
  }

  /**
   * remove all geometries and clears the history
   */
  clearAll() {
    this.options.geoJSON.clearAll();
  }

}
