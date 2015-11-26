'use strict';

import mapboxgl from 'mapbox-gl';

import Line from './geometries/line';
import Point from './geometries/point';
import Polygon from './geometries/polygon';

export default class API extends mapboxgl.Control {
  constructor() {
    super();
  }

  /**
   * add a geometry
   * @param {Object} feature - GeoJSON feature
   * @returns {Draw} this
   */
  set(feature) {
    feature = JSON.parse(JSON.stringify(feature));
    var id;
    if (feature.type === 'FeatureCollection') {
      id = [];
      for (var i = 0; i < feature.features.length; i++) {
        id.push(this._setFeature(feature.features[i]));
      }
    } else {
      id = this._setFeature(feature);
    }
    this._store._render();
    //return feature.drawId;
    return id;
  }

  /**
   * a helper method of `set()` for individual features
   * @private
   */
  _setFeature(feature) {
    if (!feature.geometry)
      feature = {
        type: 'Feature',
        geometry: feature
      };
    switch (feature.geometry.type) {
      case 'Point':
        feature = new Point(this._map, feature);
        break;
      case 'LineString':
        feature = new Line(this._map, feature);
        break;
      case 'Polygon':
        feature = new Polygon(this._map, feature);
        break;
      default:
        console.log('MapboxGL Draw: Unsupported geometry type "' + feature.geometry.type + '"');
        return;
    }
    this._store.set(feature, true);
    if (this.options.interactive) {
      this._edit(feature.getDrawId());
    }
    return feature.drawId;
  }

  /**
   * remove a geometry by its draw id
   * @param {String} id - the drawid of the geometry
   * @returns {Draw} this
   */
  remove(id) {
    this._store.unset(id);
    return this;
  }

  /**
   * Updates an existing feature
   * @param {String} drawId - the drawId of the feature to update
   * @param {Object} feature - a GeoJSON feature
   * @returns {Draw} this
   */
  update(drawId, feature) {
    feature = JSON.parse(JSON.stringify(feature));
    var newFeatType = feature.type === 'Feature' ? feature.geometry.type : feature.type;
    var feat = this._store.get(drawId);
    if (feat.getGeoJSONType() !== newFeatType || feat.getType() === 'square') {
      throw 'Can not update feature to different type and can not update squares';
    }
    feat.setCoordinates(feature.coordinates || feature.geometry.coordinates);
    if (feature.properties) feat.setProperties(feature.properties);
    return this;
  }

  /**
   * get a geometry by its draw id
   * @param {String} id - the draw id of the geometry
   */
  get(id, includeDrawId) {
    var geom = this._store.getGeoJSON(id);
    if (!includeDrawId) delete geom.properties.drawId;
    return geom;
  }

  /**
   * get all draw geometries
   * @returns {Object} a GeoJSON feature collection
   */
  getAll(includeDrawId) {
    var geom = this._store.getAllGeoJSON();
    if (!includeDrawId) {
      geom.features = geom.features.map(feat => {
        delete feat.properties.drawId;
        return feat;
      });
    }
    return geom;
  }

  /**
   * get a feature collection of features being editted
   * @return {Object} a feature collection of geometries that are in edit mode
   */
  getEditting() {
    return this._editStore.getAllGeoJSON();
  }

  /**
   * remove all geometries
   * @returns {Draw} this
   */
  clear() {
    this._store.clear();
    return this;
  }

}
