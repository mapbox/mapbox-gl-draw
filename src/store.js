'use strict';

function Store(obj) {
  this._data = {
    type: 'FeatureCollection',
    features: obj
  };
}

Store.prototype = {
  getAll() {
    return this._data;
  },

  clear() {
    this._data.features = [];
  },

  get() {
    // TODO get a specific geojson object
  },

  unset() {
    // TODO undo management.
    this._history = this.getAll().features;
    // TODO remove a specific geojson object
  },

  set(type, coords) {

    var obj = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: type,
        coordinates: coords
      }
    };

    this._data.features.push(obj);
    return obj;
  }
};

module.exports = Store;
