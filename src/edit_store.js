'use strict';

/**
 * A store for keeping track of in progress
 * feature edits before they written into history
 *
 * @param {array} data - an array of geojson features (for a Feature Collection)
 *
 * will eventually support mass edits
 */

function EditStore(map, data) {
  this._map = map;
  this.features = data || [];
}

EditStore.prototype = {

  getAll() {
    return {
      type: 'FeatureCollection',
      features: this.features
    };
  },

  getById(id) {
    return this.features.filter(feat => feat.properties._drawid === id)[0];
  },

  clear() {
    this.features = [];

    this._map.fire('edit.feature.update', {
      geojson: this.getAll()
    });
  },

  update(feature) {
    this.features = this.features
      .filter(feat => feat.properties._drawid !== feature.properties._drawid);
    this.features.push(feature);

    this._map.fire('edit.feature.update', {
      geojson: this.getAll()
    });
  }
};

module.exports = EditStore;
