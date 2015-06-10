'use strict';

var util = require('../util');
var Store = require('../store');

var drawStore = new Store([]);
var editStore = new Store([]);

module.exports = {

  initialize(map, options) {
    this._map = map;
    this._container = map.getContainer();
    util.setOptions(this, options);
    this.enable();
  },

  enable() {
    var map = this._map;
    if (map) {
      map.getContainer().focus();
      util.DOM.disableSelection();
      this._container.addEventListener('keyup', this._cancelDrawing.bind(this));
      this._container.classList.add('mapboxgl-draw-activated');
      this._map.fire('draw.start', { featureType: this.type });
      this.drawStart();
    }
  },

  disable() {
    if (this._map) {
      util.DOM.enableSelection();
      this._container.removeEventListener('keyup', this._cancelDrawing.bind(this));
      this._container.classList.remove('mapboxgl-draw-activated');
      this._map.fire('draw.stop', { featureType: this.type });
      this.drawStop();
    }
  },

  editCreate(coords) {
    editStore.set('Point', coords);
    this._map.fire('edit.feature.create', {geojson: editStore.getAll()});
  },

  drawCreate(type, coords) {
    var feature = drawStore.set(type, coords);
    this._map.fire('draw.feature.create', {geojson: drawStore.getAll()});
    this._created(feature);
  },

  _created(feature) {
    this._map.fire('draw.created', {
      featureType: this.type,
      feature: feature
    });
  },

  _cancelDrawing(e) {
    if (e.keyCode === 27) this.disable();
  }
};
