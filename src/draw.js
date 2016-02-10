'use strict';

import Polyfill from './lib/polyfills';
Polyfill();

import API from './api';
import { DOM, createButton } from './util';

// GL Styles
import drawSelectedTheme from './theme/draw-selected';
import drawTheme from './theme/draw';

// Data stores
import Store from './store';

// Control handlers
import Line from './feature_types/line';
import Point from './feature_types/point';
import Square from './feature_types/square';
import Polygon from './feature_types/polygon';

import DrawEvents from './draw_events';

// default control options for Draw constructor
const defaultControls = {
  marker: true,
  line: true,
  shape: true,
  square: true,
  trash: true
};

/**
 * Draw plugin for Mapbox GL JS
 *
 * @param {Object} options
 * @param {Boolean} [options.drawing=true] - The ability to draw and delete features
 * @param {Boolean} [options.interactive=false] - Keep all features permanently in selected mode
 * @param {Boolean} [options.keybindings=true] - Keyboard shortcuts for drawing
 * @param {Object} [options.controls] - drawable shapes
 * @param {Boolean} [options.controls.marker=true]
 * @param {Boolean} [options.controls.line=true]
 * @param {Boolean} [options.controls.shape=true]
 * @param {Boolean} [options.controls.square=true]
 * @param {Object} [options.styles] - Mapbox GL JS style for draw features
 * @returns {Draw} this
 */
export default class Draw extends API {

  constructor(options = {controls: {}}) {
    super();
    options.controls = Object.assign(defaultControls, options.controls);
    this.options = {
      drawing: true,
      interactive: false,
      position: 'top-left',
      keybindings: true,
      styles: {},
      controls: {}
    };

    this._events = DrawEvents(this);

    Object.assign(this.options, options);

  }

  /**
   * @private
   */
  onAdd(map) {
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    this._store = new Store(map, this);

    this._map = map;

    if (this.options.drawing) {
      this._createButtons();
    }

    if (map.style.loaded()) { // not public
      this._setEventListeners();
      this._setStyles();
    } else {
      map.on('load', () => {
        this._setEventListeners();
        this._setStyles();
      });
    }

    return container;
  }

  _createButtons() {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var controls = this.options.controls;

    if (controls.line) {
      this.lineStringCtrl = createButton(this._container, {
        className: controlClass + ' line',
        title: `LineString tool ${this.options.keybindings && '(l)'}`,
        fn: this.startDrawing.bind(this, this.types.LINE),
        id: 'lineDrawBtn'
      }, this._controlClass);
    }

    if (controls.shape) {
      this.polygonCtrl = createButton(this._container, {
        className: `${controlClass} shape`,
        title: `Polygon tool ${this.options.keybindings && '(p)'}`,
        fn: this.startDrawing.bind(this, this.types.POLYGON),
        id: 'polygonDrawBtn'
      }, this._controlClass);
    }

    if (controls.square) {
      this.squareCtrl = createButton(this._container, {
        className: `${controlClass} square`,
        title: `Square tool ${this.options.keybindings && '(s)'}`,
        fn: this.startDrawing.bind(this, this.types.SQUARE),
        id: 'squareDrawBtn'
      }, this._controlClass);
    }

    if (controls.marker) {
      this.markerCtrl = createButton(this._container, {
        className: `${controlClass} marker`,
        title: `Marker tool ${this.options.keybindings && '(m)'}`,
        fn: this.startDrawing.bind(this, this.types.POINT),
        id: 'pointDrawBtn'
      }, this._controlClass);
    }

    if (controls.trash) {
      this.deleteBtn = createButton(this._container, {
        className: 'mapboxgl-ctrl-draw-btn trash',
        title: 'delete',
        fn: this._destroy.bind(this),
        id: 'deleteBtn'
      }, this._controlClass);
      this._hideDeleteButton();
    }
  }

  _showDeleteButton() {
    if (this.options.controls.trash && this.options.drawing) {
      this.deleteBtn.style.display = 'block';
    }
  }

  _hideDeleteButton() {
    if (this.options.controls.trash && this.options.drawing) {
      this.deleteBtn.style.display = 'none';
    }
  }

  /**
   * @private
   */
  _destroy() {
    this._store.clearSelected();
    this._handleDrawFinished();
  }

  startDrawing(type) {
    this._events.destroyNewFeature();
    this._handleDrawFinished();
    var obj = null;
    switch (type) {
      case this.types.POLYGON:
        obj = new Polygon({map: this._map});
        break;
      case this.types.LINE:
        obj = new Line({ map: this._map });
        break;
      case this.types.SQUARE:
        obj = new Square({ map: this._map });
        break;
      case this.types.POINT:
        obj = new Point({ map: this._map });
        break;
      default:
        return;
    }

    obj.startDrawing();
    this._events.setNewFeature(obj);
    var id = this._store.set(obj);
    this.select(id);
  }

  _handleDrawFinished() {
    this._store.getSelectedIds().forEach(id => this._store.commit(id));
    [ this.lineStringCtrl,
        this.polygonCtrl,
        this.squareCtrl,
        this.markerCtrl ].forEach(ctrl => { if (ctrl) ctrl.classList.remove('active'); });
  }

  /**
   * @private
   */
  _setEventListeners() {

    this._map.on('click', this._events.onClick);
    this._map.on('dblclick', this._events.onDoubleClick);
    this._map.getContainer().addEventListener('mousedown', this._events.onMouseDown);
    this._map.getContainer().addEventListener('mouseup', this._events.onMouseUp);
    this._map.on('mousemove', this._events.onMouseMove);

    this._map.getContainer().addEventListener('keydown', this._events.onKeyDown);

    if (this.options.keybindings) {
      this._map.getContainer().addEventListener('keyup', this._events.onKeyUp);
    }

  }

  _setStyles() {
    // drawn features style
    this._map.addSource('draw', {
      data: {
        type: 'FeatureCollection',
        features: []
      },
      type: 'geojson'
    });

    for (let i = 0; i < drawTheme.length; i++) {
      let style = drawTheme[i];
      Object.assign(style, this.options.styles[style.id] || {});
      this._map.addLayer(style);
    }

    // selected features style
    this._map.addSource('draw-selected', {
      data: {
        type: 'FeatureCollection',
        features: []
      },
      type: 'geojson'
    });

    for (let i = 0; i < drawSelectedTheme.length; i++) {
      let style = drawSelectedTheme[i];
      Object.assign(style, this.options.styles[style.id] || {});
      this._map.addLayer(style);
    }

    this._store._render();
  }

  _removeLayers() {
    for (let i = 0; i < drawTheme.length; i++) {
      let { id } = drawTheme[i];
      this._map.removeLayer(id);
    }

    for (let i = 0; i < drawSelectedTheme.length; i++) {
      let { id } = drawSelectedTheme[i];
      this._map.removeLayer(id);
    }

    this._map.removeSource('draw');
    this._map.removeSource('draw-selected');
  }

  _removeButtons() {
    if (!this.options.drawing) {
      return;
    }
    var controls = this.options.controls;

    if (controls.trash) this.deleteBtn.parentNode.removeChild(this.deleteBtn);
    if (controls.square) this.squareCtrl.parentNode.removeChild(this.squareCtrl);
    if (controls.line) this.lineStringCtrl.parentNode.removeChild(this.lineStringCtrl);
    if (controls.shape) this.polygonCtrl.parentNode.removeChild(this.polygonCtrl);
    if (controls.marker) this.markerCtrl.parentNode.removeChild(this.markerCtrl);
  }

  remove() {
    this._removeLayers();
    this._removeButtons();
    super.remove();
  }

}
