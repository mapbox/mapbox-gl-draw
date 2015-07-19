'use strict';

function EditStore(data) {
  this.features = data; // an array of features for editing
}

EditStore.prototype = {

  getAll() { // for rendering
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
    this.features = this.features.filter(feat => feat.properties._drawid !== feature.properties._drawid);
    this.features.push(feature);
  }
};

module.exports = EditStore;
