'use strict';

var util = require('../util');
var Store = require('../store');
var hat = require('hat');

var drawStore = new Store([]);
var editStore = new Store([]);

module.exports = {

  initialize(map, options) {
    this._map = map;
    this._currentFeature = false;
    this._container = map.getContainer();
    util.setOptions(this, options);

    this._onKeyUp = this._onKeyUp.bind(this);
    this.enable();
  },

  enable() {
    var map = this._map;
    if (map) {
      util.DOM.disableSelection();
      this._container.addEventListener('keyup', this._onkeyup);
      this._container.classList.add('mapboxgl-draw-activated');
      map.fire('draw.start', { featureType: this.type });
      this.drawStart();
    }
  },

  disable() {
    util.DOM.enableSelection();
    this._container.removeEventListener('keyup', this._onKeyUp);
    this._container.classList.remove('mapboxgl-draw-activated');
    this._map.fire('draw.stop', { featureType: this.type });
    this.drawStop(this._map);
  },

  featureComplete() {
    this._currentFeature = false;
  },

  editCreate(type, coords) {
    var id = hat();

    // Keeps track of temporary linestring guideline that's
    // drawn after the second point is selected.
    if (type === 'LineString') this._editLineGuide = id;
    editStore.set(type, id, coords);
    this._map.fire('edit.feature.update', {geojson: editStore.getAll()});
  },

  editUnsetGuide() {
    if (this._editLineGuide) editStore.unset('LineString', this._editLineGuide);
    this._editLineGuide = false;
  },

  editDestroy() {
    editStore.clear();
    this._map.fire('edit.feature.update', {geojson: editStore.getAll()});
  },

  drawCreate(type, coords) {
    if (!this._currentFeature) this._currentFeature = hat();
    var feature = drawStore.set(type, this._currentFeature, coords);

    this._map.fire('draw.feature.update', {
      geojson: drawStore.getAll()
    });

    this._map.fire('draw.created', {
      featureType: this.type,
      feature: feature
    });
  },

  _onKeyUp(e) {
    switch (e.keyCode) {
      case 27: // ESC
      this.disable();
      break;
    }
  }
};
