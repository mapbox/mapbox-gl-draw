'use strict';

import bboxPoly from 'turf-bbox-polygon';
import intersect from 'turf-intersect';

/**
 * A store for keeping track of versions of drawings
 *
 * @param {Array<Object>} data An array of GeoJSON object
 * @returns {Store} this
 */
export default class Store {

  constructor(map) {
    this._map = map;
    this._features = {};
    this._editStore = null;
    this._map.on('drawing.end', e => {
      this.set(e.geometry);
    });
  }

  setEditStore(editStore) {
    this._editStore = editStore;
  }

  getAllGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: Object.keys(this._features).map(k => this._features[k].toGeoJSON())
    };
  }

  get(id) {
    return this._features[id];
  }

  getGeoJSON(id) {
    return this._features[id].toGeoJSON();
  }

  clear() {
    this._features = {};
    this._render();
  }

  /**
   * @param {Object} feature - GeoJSON feature
   */
  set(feature, preventRender) {
    this._features[feature.drawId] = feature;
    if (!preventRender) {
      this._render();
    }
  }

  /**
   * @param {String} id - feature id
   */
  unset(id) {
    delete this._features[id];
    this._render();
  }

  /**
   * @param {String} id - the drawId of a feature
   * @return {Object} - GeoJSON feature
   * @private
   */
  edit(id) {
    this._editStore.set(this._features[id]);
    delete this._features[id];
    this._render();
  }

  /**
   * @param {Object} p1 - the pixel coordinates of the first point
   * @param {Object} p2 - the pixel coordinates of the second point
   */
  editFeaturesIn(p1, p2) {
    p1 = this._map.unproject([ p1.x, p1.y ]);
    p2 = this._map.unproject([ p2.x, p2.y ]);
    var latMin = p1.lat < p2.lat ? p1.lat : p2.lat;
    var lngMin = p1.lng < p2.lng ? p1.lng : p2.lng;
    var latMax = p1.lat > p2.lat ? p1.lat : p2.lat;
    var lngMax = p1.lng > p2.lng ? p1.lng : p2.lng;
    var bbox = bboxPoly([ lngMin, latMin, lngMax, latMax ]);
    var inside = [];
    for (var id in this._features) {
      if (intersect(this._features[id].toGeoJSON(), bbox)) {
        inside.push(id);
      }
    }
    for (var i = 0; i < inside.length; i++) {
      this.edit(inside[i]);
    }
  }

  _render() {
    this._map.fire('draw.feature.update', {
      geojson: this.getAllGeoJSON()
    });
  }

}
