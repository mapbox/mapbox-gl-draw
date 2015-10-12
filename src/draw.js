'use strict';

import R from 'ramda';
import mapboxgl from 'mapbox-gl';
import EditStore from './edit_store';
import themeEdit from './theme/edit';
import themeStyle from './theme/style';
import themeDrawing from './theme/drawing';
import { DOM, createButton } from './util';

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

    Object.assign(this, options);

    // event listeners
    this.drag = this._drag.bind(this);
    this.onClick = this._onClick.bind(this);
    this.onKeyUp = this._onKeyUp.bind(this);
    this.endDrag = this._endDrag.bind(this);
    this.onKeyDown = this._onKeyDown.bind(this);
    this.onMouseUp = this._onMouseUp.bind(this);
    this.onMouseDown = this._onMouseDown.bind(this);
    this.initiateDrag = this._initiateDrag.bind(this);

  }

  onAdd(map) {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    var controls = this.options.controls;
    this._store = new Store(map);
    this._editStore = new EditStore(map);
    this._store.setEditStore(this._editStore);
    this._editStore.setDrawStore(this._store);

    // Build out draw controls
    if (controls.line) {
      this.lineStringCtrl = createButton(this._container, {
        className: controlClass + ' line',
        title: `LineString tool ${this.options.keybindings && '(l)'}`,
        fn: this._drawLine.bind(this),
        id: 'lineDrawBtn'
      }, this._controlClass);
    }

    if (controls.shape) {
      this.polygonCtrl = createButton(this._container, {
        className: `${controlClass} shape`,
        title: `Polygon tool ${this.options.keybindings && '(p)'}`,
        fn: this._drawPolygon.bind(this),
        id: 'polygonDrawBtn'
      }, this._constrolClass);
    }

    if (controls.square) {
      this.squareCtrl = createButton(this._container, {
        className: `${controlClass} square`,
        title: `Square tool ${this.options.keybindings && '(s)'}`,
        fn: this._drawSquare.bind(this),
        id: 'squareDrawBtn'
      }, this._controlClass);
    }

    if (controls.marker) {
      this.markerCtrl = createButton(this._container, {
        className: `${controlClass} marker`,
        title: `Marker tool ${this.options.keybindings && '(m)'}`,
        fn: this._drawPoint.bind(this),
        id: 'pointDrawBtn'
      }, this._controlClass);
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
    const SHIFT_KEY = 16;
    if (e.keyCode === SHIFT_KEY) {
      this.shiftDown = true;
    }
  }

  _onMouseDown(e) {
    if (this.shiftDown) {
      this._featsInStart = DOM.mousePos(e, this._map.getContainer());
      this._map.getContainer().addEventListener('mouseup', this.onMouseUp);
    }
  }

  _onMouseUp(e) {
    if (this.shiftDown) {
      this._map.getContainer().removeEventListener('mouseup', this.onMouseUp);

      var end = DOM.mousePos(e, this._map.getContainer());

      this._map.getContainer().addEventListener('mousedown', this.initiateDrag, true);

      if (!this._editStore.inProgress())
        this.deleteBtn = createButton(this._container, {
          className: 'mapboxgl-ctrl-draw-btn trash',
          title: 'delete',
          fn: this._destroy.bind(this),
          id: 'deleteBtn'
        }, this._controlClass);

      this._store.editFeaturesIn(this._featsInStart, end);
    }
  }

  _onKeyUp(e) {

    // draw shortcuts
    const LINESTRING_KEY = 76; // (l)
    const MARKER_KEY = 77;     // (m)
    const POLYGON_KEY = 88;    // (p)
    const SQUARE_KEY = 83;     // (s)
    const EXIT_EDIT_KEY = 27;  // (esc)
    const DELETE_KEY = 68;     // (d)
    const SHIFT_KEY = 16;      // (shift)

    var event = document.createEvent('HTMLEvents');
    event.initEvent('click', true, false);

    switch (e.keyCode) {
      case LINESTRING_KEY:
        if (!this.lineStringCtrl.classList.contains('active')) {
          this.lineStringCtrl.dispatchEvent(event);
        }
        break;
      case MARKER_KEY:
        if (!this.markerCtrl.classList.contains('active')) {
          this.markerCtrl.dispatchEvent(event);
        }
        break;
      case POLYGON_KEY:
        if (!this.polygonCtrl.classList.contains('active')) {
          this.polygonCtrl.dispatchEvent(event);
        }
        break;
      case SQUARE_KEY:
        if (!this.squareCtrl.classList.contains('active')) {
          this.squareCtrl.dispatchEvent(event);
        }
        break;
      case EXIT_EDIT_KEY:
        this._finishEdit();
        break;
      case DELETE_KEY:
        if (this._editStore.inProgress()) {
          this._destroy();
        }
        break;
    }
    if (e.keyCode === SHIFT_KEY) {
      this.shiftDown = false;
    }
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
        if (this._drawing) return;
        this._edit(features[0].properties.drawId);
      } else { // clicked outside all features
        this._finishEdit();
      }
    });
  }

  _edit(drawId) {
    this._map.getContainer().addEventListener('mousedown', this.initiateDrag, true);

    if (!this._editStore.inProgress())
      this.deleteBtn = createButton(this._container, {
        className: 'mapboxgl-ctrl-draw-btn trash',
        title: 'delete',
        fn: this._destroy.bind(this),
        id: 'deleteBtn'
      }, this._controlClass);

    this._store.edit(drawId);
  }

  _finishEdit() {
    if (this._editStore.inProgress()) {
      this._editStore.finish();
      DOM.destroy(this.deleteBtn);
      this._map.getContainer().removeEventListener('mousedown', this.initiateDrag, true);
    }
  }

  _initiateDrag(e) {
    var coords = DOM.mousePos(e, this._map._container);

    this._map.featuresAt([coords.x, coords.y], { radius: 20, includeGeometry: true }, (err, features) => {

      if (err) throw err;
      else if (!features.length) return;
      else if (R.none(feat => R.contains(feat.properties.drawId, this._editStore.getDrawIds()))(features)) return;

      e.stopPropagation();

      if (features.length > 1) {
        this.vertex = R.find(feat => feat.properties.meta === 'vertex')(features);
        this.newVertex = R.find(feat => feat.properties.meta === 'midpoint')(features);
      }
      this.activeDrawId = R.find(feat => feat.properties.drawId)(features).properties.drawId;

      if (this.newVertex) {
        this._editStore.get(this.newVertex.properties.parent)
          .editAddVertex(coords, this.newVertex.properties.index);
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
      this._editStore.get(this.vertex.properties.parent)
        .moveVertex(this.init, curr, this.vertex.properties.index);
    } else {
      this._editStore.get(this.activeDrawId).translate(this.init, curr);
    }
  }

  _endDrag() {
    this._map.getContainer().removeEventListener('mousemove', this.drag, true);
    this._map.getContainer().removeEventListener('mouseup', this.endDrag, true);
    this._map.getContainer().classList.remove('mapboxgl-draw-move-activated');

    this._editStore.get(this.activeDrawId).translating = false;
    this.dragging = false;

    if (this.vertex) {
      this._editStore.get(this.vertex.properties.parent).movingVertex = false;
      this.vertex = false;
    }
  }

  _destroy() {
    this._editStore.clear();
    DOM.destroy(this.deleteBtn);
    this._map.getContainer().removeEventListener('mousedown', this.initiateDrag, true);
  }

  _drawPolygon() {
    this._finishEdit();
    var polygon = new Polygon(this._map);
    polygon.startDraw();
    this._drawing = true;
  }

  _drawLine() {
    this._finishEdit();
    var line = new Line(this._map);
    line.startDraw();
    this._drawing = true;
  }

  _drawSquare() {
    this._finishEdit();
    var square = new Square(this._map);
    square.startDraw();
    this._drawing = true;
  }

  _drawPoint() {
    this._finishEdit();
    var point = new Point(this._map);
    point.startDraw();
    this._drawing = true;
  }

  _mapState() {
    var controlClass = this._controlClass;

    this._map.on('load', () => {

      // in progress drawing style
      this._map.addSource('drawing', {
        data: {
          type: 'FeatureCollection',
          features: []
        },
        type: 'geojson'
      });
      themeDrawing.forEach(style => { this._map.addLayer(style); });

      // drawn features style
      this._map.addSource('draw', {
        data: this._store.getAllGeoJSON(),
        type: 'geojson'
      });
      themeStyle.forEach(style => { this._map.addLayer(style); });

      // features being editted style
      this._map.addSource('edit', {
        data: {
          type: 'FeatureCollection',
          features: []
        },
        type: 'geojson'
      });
      themeEdit.forEach(style => { this._map.addLayer(style); });

      this._map.on('draw.end', e => {
        this._store.set(e.geometry);
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
      });

      this._map.on('new.drawing.update', e => {
        this._map.getSource('drawing').setData(e.geojson);
      });

      // clear the drawing layer after a drawing is done
      this._map.on('drawing.end', () => {
        this._map.getSource('drawing').setData({
          type: 'FeatureCollection',
          features: []
        });
        this._drawing = false;
      });

      this._map.on('edit.feature.update', e => {
        this._map.getSource('edit').setData(e.geojson);
      });

      this._map.on('draw.feature.update', e => {
        this._map.getSource('draw').setData(e.geojson);
      });

      this._map.on('click', this.onClick);

      this._map.on('mousemove', e => {
        this._map.featuresAt(e.point, {
          radius: 7,
          layer: ['gl-edit-points', 'gl-edit-points-mid']
        }, (err, features) => {
          if (err) throw err;
          if (!features.length)
            return this._map.getContainer().classList.remove('mapboxgl-draw-move-activated');

          var vertex = R.find(feat => feat.properties.meta === 'vertex')(features);
          var midpoint = R.find(feat => feat.properties.meta === 'midpoint')(features);

          if (vertex || midpoint) {
            this._map.getContainer().classList.add('mapboxgl-draw-move-activated');
            this.hoveringOnVertex = true;
          }
        });
      });

      this._map.getContainer().addEventListener('mousedown', this.onMouseDown);
    });

  }

  //*************************//
  //  API Methods - turn up  //
  //*************************//

  /**
   * add a geometry
   * @param {Object} feature - GeoJSON feature
   * @returns {Draw} this
   */
  set(feature) {
    feature = JSON.parse(JSON.stringify(feature));
    if (feature.type === 'FeatureCollection') {
      for (var i = 0; i < feature.features.length; i++) {
        this.set(feature.features[i]);
      }
    } else {
      if (!feature.geometry)
        feature = {
          type: 'Feature',
          geometry: feature
        };
      switch (feature.geometry.type) {
        case 'Point':
          feature = new Point(this._map, feature);
          break;
        case 'LineString':
          feature = new Line(this._map, feature);
          break;
        case 'Polygon':
          feature = new Polygon(this._map, feature);
          break;
        default:
          //throw new Error('unsupported geometry type: ' + feature.geometry.type);
          console.log('MapboxGL Draw: Unsupported geometry type "' + feature.geometry.type + '"');
          return;
      }
      this._store.set(feature);
    }
    return feature.drawId;
  }

  /**
   * remove a geometry by its draw id
   * @param {String} id - the drawid of the geometry
   * @returns {Draw} this
   */
  remove(id) {
    this._store.unset(id);
    return this;
  }

  /**
   * Updates an existing feature
   * @param {String} drawId - the drawId of the feature to update
   * @param {Object} feature - a GeoJSON feature
   * @returns {Draw} this
   */
  update(drawId, feature) {
    feature = JSON.parse(JSON.stringify(feature));
    var newFeatType = feature.type === 'Feature' ? feature.geometry.type : feature.type;
    var feat = this._store.get(drawId);
    if (feat.getGeoJSONType() !== newFeatType || feat.getType() === 'square') {
      throw 'Can not update feature to different type and can not update squares';
    }
    feat.setCoordinates(feature.coordinates || feature.geometry.coordinates);
    if (feature.properties) feat.setProperties(feature.properties);
    return this;

  }

  /**
   * get a geometry by its draw id
   * @param {String} id - the draw id of the geometry
   */
  get(id, includeDrawId) {
    var geom = this._store.getGeoJSON(id);
    if (!includeDrawId) delete geom.properties.drawId;
    return geom;
  }

  /**
   * get all draw geometries
   * @returns {Object} a GeoJSON feature collection
   */
  getAll(includeDrawId) {
    var geom = this._store.getAllGeoJSON();
    if (!includeDrawId) {
      geom.features = geom.features.map(feat => {
        delete feat.properties.drawId;
        return feat;
      });
    }
    return geom;
  }

  /**
   * remove all geometries
   * @returns {Draw} this
   */
  clear() {
    this._store.clear();
    return this;
  }

}
