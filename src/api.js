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
   * @param {Object} [options]
   * @pata {Boolean} [options.permanent=false] - disable editing for feature
   * @returns {Number} draw id of the set feature or an array of
   * draw ids if a feature collection was added
   */
  set(feature, options) {
    feature = JSON.parse(JSON.stringify(feature));
    if (feature.type === 'FeatureCollection') {
      return feature.features.map(subFeature => this.set(subFeature, options));
    }

    if (!feature.geometry) {
      feature = {
        type: 'Feature',
        geometry: feature
      };
    }

    if (!options) {
      options = {};
    }
    options.map = this._map;
    options.data = feature;

    var internalFeature;
    switch (feature.geometry.type) {
      case 'Point':
        internalFeature = new Point(options);
        break;
      case 'LineString':
        internalFeature = new Line(options);
        break;
      case 'Polygon':
        internalFeature = new Polygon(options);
        break;
      default:
        throw new Error('MapboxGL Draw: Unsupported geometry type "' + feature.geometry.type + '"');
    }

    this._store.set(internalFeature);
    if (this.options.interactive) {
      this._edit(internalFeature.drawId);
    }

    return internalFeature.drawId;
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
    if (feat.geojson.geometry.type !== newFeatType || feat.getType() === 'square') {
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
  get(id) {
    var feature = this._store.get(id);
    return feature && feature.toGeoJSON();
  }

  /**
   * get all draw geometries
   * @returns {Object} a GeoJSON feature collection
   */
  getAll() {
    return this._store.getAllIds()
      .map(id => this._store.get(id).toGeoJSON())
      .reduce(function (FC, feature) {
        FC.features.push(feature);
        return FC;
      }, {
        type: 'FeatureCollection',
        features: []
      });
  }

  /**
   * get a feature collection of features being editted
   * @return {Object} a feature collection of geometries that are in edit mode
   */
  getEditing() {
    return this._store.getEditIds()
      .map(id => this._store.get(id).toGeoJSON())
      .reduce(function(FC, feature) {
        FC.features.push(feature);
        return FC;
      }, {
        type: 'FeatureCollection',
        features: []
      });
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
   * remove all geometries
   * @returns {Draw} this
   */
  clear() {
    this._store.clear();
    return this;
  }

}
