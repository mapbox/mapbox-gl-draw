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

  constructor(map/*, features*/) {
    this._map = map;
    //this.features = features || [];
    this._features = {};

    this.drawStore = null;
    //this.editting = false;
    //this.drawing = false;

    this._map.on('new.edit', () => {
      this._render();
    });

    this._map.on('finish.edit', () => {
      //this.features = [];
      //this.features = {};
      this._render();
    });

    this._map.on('edit.end', e => {
      this.endEdit(e.geometry.drawId);
    });
  }

  setDrawStore(drawStore) {
    this._drawStore = drawStore;
  }

  set(geometry) {
    /*
    if (geometry instanceof Array) {
      this.features = this.features.concat(geometry);
    } else {
      this.features.push(geometry);
    }
    */
    this.features[geometry.drawId] = geometry;
    //this.activeId = geometry.editId;
    //this.editting = true;
    this._render();
  }

  //setBatch(geoms) {
  //  this.features = this.features.concat(geoms);
  //  this._render();
  //}

  finish() {
    //for (var i = 0; i < this.features.length; i++) {
    //  this.drawStore.set(this.features[i]);
    //}
    //this.features = [];
    for (var id in this._features) {
      this._drawStore.set(this._features[id]);
      delete this._features[id];
    }
    this._render();
  }

  //getAll() {
  //  return this.features;
  //}

  getAllGeoJSON() {
    //return {
    //  type: 'FeatureCollection',
    //  features: this.features.map(feature => feature.getGeoJSON())
    //};
    return {
      type: 'FeatureCollection',
      features: Object.keys(this._features).map(id => this.features[id].toGeoJSON())
    };

  }

  get(id) {
    //return this.features.filter(feat => feat.drawId === id)[0];
    return this._features[id];
  }

  getGeoJSON(id) {
    //return this.features.filter(feat => feat.drawId === id)[0].getGeoJSON();
    return this._features[id].toGeoJSON();
  }

  //endEdit(id) {
  //  this.features = this.features.filter(feat => feat.drawId !== id);
  //  this._render();
  //}

  clear() {
    //this.features = [];
    this.features = {};
    this._render();
  }

  //inProgress() {
  //  return this.features.length > 0;
  //}

  _addVertices() {
    var vertices = [];

    //for (var i = 0; i < this.features.length; i++) {
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

    //for (var i = 0; i < this.features.length; i++) {
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
