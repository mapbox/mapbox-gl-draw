'use strict';

/**
 * A store for keeping track of in progress
 * feature edits before they written into history
 * We also call draft rendering here
 *
 * @param {array} data - an array of geojson features (for a Feature Collection)
 *
 * will eventually support mass edits
 */

function EditStore(map, features) {
  this._map = map;
  this.features = features;
  this.features.forEach(feat => this.update(feat));
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
    this.render();
  },

  update(feature) {
    this.features = this.features
      .filter(feat => feat.properties._drawid !== feature.properties._drawid);
    this.features.push(feature);
    this.render();
  },

  render() {
    this._map.fire('edit.feature.update', {
      geojson: this.getAll()
    });
  }
};

module.exports = EditStore;
