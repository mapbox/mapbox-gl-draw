'use strict';

/**
 * A store for keeping track of in progress
 * feature edits before they written into history
 * We also call draft rendering here
 *
 * @param {Map} map - an instance of mapboxgl.Map
 * @param {Array<Object>} features - an array of geojson features
 * @returns {EditStore} this
 * @private
 */
export default class EditStore {

  constructor(map) {
    this._map = map;
    this._features = {};

    this.drawStore = null;

    this._map.on('new.edit', () => { this._render(); });
    this._map.on('finish.edit', () => { this._render(); });
    this._map.on('edit.end', e => { this.endEdit(e.geometry.drawId); });
  }

  setDrawStore(drawStore) {
    this._drawStore = drawStore;
  }

  set(geometry) {
    this._features[geometry.drawId] = geometry;
    this._render();
  }

  finish() {
    for (var id in this._features) {
      this._drawStore.set(this._features[id]);
      delete this._features[id];
    }
    this._render();
  }

  getAllGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: Object.keys(this._features).map(id => this._features[id].toGeoJSON())
    };

  }

  get(id) {
    return this._features[id];
  }

  inProgress() {
    return Object.keys(this._features).length > 0;
  }

  getGeoJSON(id) {
    return this._features[id].toGeoJSON();
  }

  clear() {
    this._features = {};
    this._render();
  }

  _addVertices() {
    var vertices = [];

    for (var id in this.features) {
      var coords = this.features[id].toGeoJSON().geometry.coordinates;
      var type = this.features[id].toGeoJSON().geometry.type;
      if (type === 'LineString' || type === 'Polygon') {
        coords = type === 'Polygon' ? coords[0] : coords;
        var l = type === 'LineString' ? coords.length : coords.length - 1;
        for (var j = 0; j < l; j++) {
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

    for (var id in this.features) {
      if (this.features[id].type === 'square') continue;

      var feat = this.features[id];
      var c = feat.getGeoJSON().geometry.coordinates;

      if (feat.getGeoJSON().geometry.type === 'LineString' ||
          feat.getGeoJSON().geometry.type === 'Polygon') {

        c = feat.getGeoJSON().geometry.type === 'Polygon' ? c[0] : c;

        for (var j = 0; j < c.length - 1; j++) {
          var ptA = this._map.project([ c[j][0], c[j][1] ]);
          var ptB = this._map.project([ c[j + 1][0], c[j + 1][1] ]);
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

  _render() {
    var geom = this.getAllGeoJSON();
    geom.features = geom.features.concat(this._addVertices(), this._addMidpoints());
    this._map.fire('edit.feature.update', {
      geojson: geom
    });
  }

}
