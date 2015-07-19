'use strict';

/**
 * A store for keeping track of in progress
 * feature edits before they written into history
 *
 * @param {array} data - an array of geojson features
 *
 * will eventually support mass edits
 */

function EditStore(data) {
  this.features = data;
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
  },

  update(feature) {
    this.features = this.features
      .filter(feat => feat.properties._drawid !== feature.properties._drawid);
    this.features.push(feature);
  }
};

module.exports = EditStore;
