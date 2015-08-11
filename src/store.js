'use strict';

import { LatLng, LatLngBounds } from 'mapbox-gl';
import Immutable from 'immutable';
import extent from 'turf-extent';

/**
 * A store for keeping track of versions of drawings
 *
 * @param {Array<Object>} data An array of GeoJSON object
 * @returns {Store} this
 */
export default class Store {

  constructor(map, data) {
    this._map = map;
    this.historyIndex = 0;
    this.history = [ Immutable.List([]) ];
    this.annotations = Immutable.List([]);

    if (data.length) {
      for (var i = 0; i < data.length; i++) {
        this.history[0] = this.history[0].push(data[i]);
      }
    }

    this._map.on('edit.end', e => {
      this.set(e.geometry);
    });
  }

  operation(fn, annotation) {
    // Wrap an operation: Given a function, apply it the history list.
    // via http://www.macwright.org/2015/05/18/practical-undo.html
    this.annotations = this.annotations.slice(0, this.historyIndex + 1);
    this.history = this.history.slice(0, this.historyIndex + 1);
    var newVersion = fn(this.history[this.historyIndex]);
    this.history.push(newVersion);
    this.annotations = this.annotations.push(annotation);
    this.historyIndex++;
    this.render();
  }

  getAll() {
    return {
      type: 'FeatureCollection',
      features: this.history[this.historyIndex]
    };
  }

  getAllGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: this.history[this.historyIndex].map(feature => feature.geojson.toJS()).toJS()
    };
  }

  get(id) {
    return this.history[this.historyIndex].find(feature => feature.drawId === id);
  }

  getFeaturesIn(bounds) {
    var results = [];
    var features = this.getAll().features;
    for (var i = 0; i < features.length; i++) {
      var ext = extent(features[i]);
      ext = new LatLngBounds(
        new LatLng(ext[1], ext[0]),
        new LatLng(ext[3], ext[2])
      );
      if (bounds.getNorth() < ext.getSouth() ||
          bounds.getSouth() > ext.getNorth() ||
          bounds.getEast() < ext.getWest() ||
          bounds.getWest() > ext.getEast()) {
        continue;
      } else {
        results.push(features[i]);
      }
    }
    return results;
  }

  clear() {
    this.operation(() => Immutable.List([]), 'remove all geometries');
  }

  clearAll() {
    this.historyIndex = 0;
    this.history = [Immutable.fromJS([])];
    this.annotations = Immutable.List([]);
  }

  /**
   * @param {Object} feature - GeoJSON feature
   */
  set(feature) {
    this.operation(data => data.push(feature), 'Added a ' + feature.type);
  }

  /**
   * @param {String} id - the drawId of a feature
   * @return {Object} - GeoJSON feature
   * @private
   */
  edit(id) {
    var data = this.history[this.historyIndex];
    var geometry = data.find(geom => geom.drawId === id);
    this.history[++this.historyIndex] = data.filterNot(geom => geom.drawId === id);

    this.render();
    return geometry;
  }

  render() {
    this._map.fire('draw.feature.update', {
      geojson: this.getAllGeoJSON()
    });
  }

  redo() {
    if (this.historyIndex < this.history.length) this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) this.historyIndex--;
  }

}
