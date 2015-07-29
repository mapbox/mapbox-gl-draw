'use strict';

/**
 * A store for keeping track of in progress
 * feature edits before they written into history
 * We also call draft rendering here
 *
 * @param {Map} map - an instance of mapboxgl.Map
 * @param {Array<Object>} [features] - an array of geojson features
 * @returns {EditStore} this
 *
 */
export default class EditStore {

  constructor(map, features) {
    this._map = map;
    this.features = features;
    if (this.features[0].geometry.coordinates.length)
      this.features.forEach(feat => this.update(feat));
  }

  getAll() {
    return {
      type: 'FeatureCollection',
      features: this.features
    };
  }

  getById(id) {
    return this.features.filter(feat => feat.properties._drawid === id)[0];
  }

  clear() {
    this.features = [];
    this.render();
  }

  update(feature) {
    this.features = this.features
      .filter(feat => feat.properties._drawid !== feature.properties._drawid);
    this.features.push(feature);
    this.render();
  }

  _addVertices() {
    var vertices = [];

    for (var i = 0; i < this.features.length; i++) {
      var coords = this.features[i].geometry.coordinates;
      var type = this.features[i].geometry.type;
      if (type === 'LineString' || type === 'Polygon') {
        coords = type === 'Polygon' ? coords[0] : coords;
        for (var j = 0; j < coords.length - 1; j++) {
          vertices.push({
            type: 'Feature',
            properties: {
              meta: 'vertex',
              index: j
            },
            geometry: {
              type: 'Point',
              coordinates: coords[j]
            }
          });
        }
      }
    }

    return vertices;
  }

  _addMidpoints() {
    var midpoints = [];

    for (var i = 0; i < this.features.length; i++) {
      var feat = this.features[i];
      var c = feat.geometry.coordinates;

      if (feat.geometry.type === 'LineString' ||
          feat.geometry.type === 'Polygon' && c[0][0][0] !== c[0][1][0]) {

        c = feat.geometry.type === 'Polygon' ? c[0] : c;

        for (var j = 0; j < c.length - 1; j++) {
          var ptA = this._map.project([ c[j][1], c[j][0] ]);
          var ptB = this._map.project([ c[j + 1][1], c[j + 1][0] ]);
          var mid = this._map.unproject([ (ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2 ]);
          midpoints.push({
            type: 'Feature',
            properties: {
              meta: 'midpoint',
              index: j + 1
            },
            geometry: {
              type: 'Point',
              coordinates: [ mid.lng, mid.lat ]
            }
          });
        }

      }
    }

    return midpoints;
  }

  render() {
    var geom = this.getAll();
    geom.features = geom.features.concat(this._addVertices(), this._addMidpoints());
    this._map.fire('edit.feature.update', {
      geojson: geom
    });
  }

}
