'use strict';

import InternalEvents from './internal_events';

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
    InternalEvents.on('drawing.end', e => {
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

  /**
   * remove all features from the store
   */
  clear() {
    this._features = {};
    this._render();
  }

  /**
   * @param {Object} feature - GeoJSON feature
   */
  set(feature, preventRender) {
    this._features[feature.drawId] = feature;

    this._map.fire('draw.set', {
      id: feature.drawId,
      geojson: feature.geojson
    });

    if (!preventRender) {
      this._render();
    }
  }

  /**
   * @param {String} id - feature id
   */
  unset(id) {
    if (this._features[id]) {
      this._map.fire('draw.delete', {
        id: id,
        geojson: this._features[id].geojson
      });
    }
    delete this._features[id];
    this._render();
  }

  /**
   * @param {String} id - the drawId of a feature
   * @return {Object} - GeoJSON feature
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
    var xMin = p1.x < p2.x ? p1.x : p2.x;
    var yMin = p1.y < p2.y ? p1.y : p2.y;
    var xMax = p1.x > p2.x ? p1.x : p2.x;
    var yMax = p1.y > p2.y ? p1.y : p2.y;
    var bbox = [ [xMin, yMin], [xMax, yMax] ];
    var drawLayers = [ 'gl-draw-polygon', 'gl-draw-line', 'gl-draw-point' ];
    this._map.featuresIn(bbox, { layers: drawLayers, type: 'vector' }, (err, features) => {
      if (err) throw err;
      // featuresIn can return the same feature multiple times
      // handle this with a reduce
      features.reduce((set, feature) => {
        var id = feature.properties.drawId;
        if (this._features[id] && set[id] === undefined) {
          set[id] = 1;
          this.edit(id);
        }
        return set;
      }, {});
    });
  }

  _render() {
    InternalEvents.emit('draw.feature.update', {
      geojson: this.getAllGeoJSON()
    });
  }

}
