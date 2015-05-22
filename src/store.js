'use strict';

module.exports = {

  getAll() {
    return this._data;
  },

  get() {
    // TODO get a specific geojson object
  },

  unset() {
    // TODO undo management.
    this._history = this.getAll().features;
    // TODO remove a specific geojson object
  },

  set(type, coordinates) {

    var obj = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: type,
        coordinates: coordinates
      }
    };

    this._data.features.push(obj);
    return obj;
  },

  _data: {
    type: 'FeatureCollection',
    features: []
  }
};
