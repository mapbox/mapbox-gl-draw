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
  if (this.features[0].geometry.coordinates.length)
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

  _addVertices() {
    var vertices = [];

    for (var i = 0; i < this.features.length; i++) {
      var feat = this.features[i];

      if (feat.geometry.type === 'Polygon') {
        // would it be more efficient to dedupe here or
        // just render the extra point?
        vertices = vertices.concat(feat.geometry.coordinates[0]);
      } else if (feat.geometry.type === 'LineString') {
        vertices = vertices.concat(feat.geometry.coordinates);
      }
    }

    return {
      type: 'Feature',
      properties: {
        meta: 'vertices'
      },
      geometry: {
        type: 'MultiPoint',
        coordinates: vertices
      }
    };
  },

  _addMidpoints() {
    var midpoints = [];

    for (var i = 0; i < this.features.length; i++) {
      var feat = this.features[i];
      var c = feat.geometry.coordinates;

      if (feat.geometry.type === 'LineString' ||
          feat.geometry.type === 'Polygon' && c[0][0][0] !== c[0][1][0]) {

        c = feat.geometry.type === 'Polygon' ? c[0] : c;

        for (var j = 0; j < c.length - 1; j++) {
          var mid = [ (c[j][0] + c[j + 1][0]) / 2, (c[j][1] + c[j + 1][1]) / 2];
          midpoints.push({
            type: 'Feature',
            properties: {
              meta: 'midpoint',
              index: j
            },
            geometry: {
              type: 'Point',
              coordinates: mid
            }
          });
        }
      }
    }

    return midpoints;
  },

  render() {
    var geom = this.getAll();
    geom.features = geom.features.concat([ this._addVertices() ], this._addMidpoints());
    console.log(JSON.stringify(this._addMidpoints(), null, 2));
    this._map.fire('edit.feature.update', {
      geojson: geom
    });
  }
};

module.exports = EditStore;
