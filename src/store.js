'use strict';

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
  set(feature) {
    this._features[feature.drawId] = feature;
    this._render();
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

  _render() {
    this._map.fire('draw.feature.update', {
      geojson: this.getAllGeoJSON()
    });
  }

}
