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
   * add a feature
   * @param {Object} feature - GeoJSON feature
   * @param {Object} [options]
   * @pata {Boolean} [options.permanent=false] - disable selection for feature
   * @returns {Number} draw id of the set feature or an array of
   * draw ids if a feature collection was added
   */
  add(feature, options) {
    feature = JSON.parse(JSON.stringify(feature));
    if (feature.type === 'FeatureCollection') {
      return feature.features.map(subFeature => this.set(subFeature, options));
    }

    if (!feature.geometry) {
      feature = {
        type: 'Feature',
        id: feature.id,
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

    internalFeature.ready = true;

    this._store.set(internalFeature);
    if (this.options.interactive) {
      this._select(internalFeature.drawId);
    }

    return internalFeature.drawId;
  }

  /**
   * Updates an existing feature
   * @param {String} id - the drawId of the feature to update
   * @param {Object} feature - a GeoJSON feature
   * @returns {Draw} this
   */
  update(id, feature) {
    feature = JSON.parse(JSON.stringify(feature));
    var _feature = this._store.get(id);
    _feature.setCoordinates(feature.coordinates || feature.geometry.coordinates);
    if (feature.properties) _feature.setProperties(feature.properties);
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
      .reduce(function(featureCollection, feature) {
        featureCollection.features.push(feature);
        return featureCollection;
      }, {
        type: 'FeatureCollection',
        features: []
      });
  }

  /**
   * select a feature
   * @param {String} id - the drawId of the feature
   * @returns {Draw} this
   */
  select(id) {
    this._store.select(id);
    return this;
  }

  /**
   * select all features
   * @param {String} id - the drawId of the feature
   * @returns {Draw} this
   */
  selectAll() {
    this._store.getAllIds()
      .forEach(id => this.select(id));
    return this;
  }

  /**
   * deselect a feature
   * @param {String} id - the drawId of the feature
   * @returns {Draw} this
   */
  deselect(id) {
    this._store.commit(id);
    return this;
  }

  /**
   * deselect all features
   * @param {String} id - the drawId of the feature
   * @returns {Draw} this
   */
  deselectAll() {
    this._store.getSelectedIds()
      .forEach(id => this.commit(id));
    return this;
  }

  /**
   * get selected feature collection of features
   * @return {Object} a feature collection of geometries that are selected
   */
  getSelected() {
    return this._store.getSelectedIds()
      .map(id => this._store.get(id).toGeoJSON())
      .reduce(function(featureCollection, feature) {
        featureCollection.features.push(feature);
        return featureCollection;
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
  destroy(id) {
    this._store.delete(id);
    return this;
  }

  /**
   * remove all geometries
   * @returns {Draw} this
   */
  clear() {
    this._store.deleteAll();
    return this;
  }

}
