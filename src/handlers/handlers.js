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

    this._onKeyUp = this._onKeyUp.bind(this);
    this.enable();
  },

  enable() {
    var map = this._map;
    if (map) {
      map.getContainer().focus();
      util.DOM.disableSelection();
      this._container.addEventListener('keyup', this._onKeyUp);
      this._container.classList.add('mapboxgl-draw-activated');
      map.fire('draw.start', { featureType: this.type });
      this.drawStart();
    }
  },

  disable() {
    util.DOM.enableSelection();
    this._container.removeEventListener('keyup', this._cancelDrawing);
    this._container.classList.remove('mapboxgl-draw-activated');
    this._map.fire('draw.stop', { featureType: this.type });
    this.drawStop(this._map);
  },

  editCreate(coords) {
    editStore.set('Point', coords);
    this._map.fire('edit.feature.update', {geojson: editStore.getAll()});
  },

  editDestroy() {
    editStore.clear();
    this._map.fire('edit.feature.update', {geojson: editStore.getAll()});
  },

  drawCreate(type, coords) {
    var feature = drawStore.set(type, coords);
    this._map.fire('draw.feature.update', {geojson: drawStore.getAll()});
    this._created(feature);
  },

  _created(feature) {
    this._map.fire('draw.created', {
      featureType: this.type,
      feature: feature
    });
  },

  _onKeyUp(e) {
    switch (e.keyCode) {
      case 27: // Esc
      this.disable();
      break;
    }
  }
};
