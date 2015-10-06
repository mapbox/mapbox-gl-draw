'use strict';

//import Immutable from 'immutable';

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
    this._map.on('draw.end', e => {
      this.set(e.geometry);
    });
    //this.historyIndex = 0;
    //this.history = [ Immutable.List([]) ];
    //this.annotations = Immutable.List([]);

    //if (data.length) {
    //  for (var i = 0; i < data.length; i++) {
    //    this.history[0] = this.history[0].push(data[i]);
    //  }
    //}

    //this._map.on('edit.end', e => {
    //  this.set(e.geometry);
    //});
  }

  setEditStore(editStore) {
    this._editStore = editStore;
  }

  //_operation(fn, annotation) {
  //  // Wrap an operation: Given a function, apply it the history list.
  //  // via http://www.macwright.org/2015/05/18/practical-undo.html
  //  this.annotations = this.annotations.slice(0, this.historyIndex + 1);
  //  this.history = this.history.slice(0, this.historyIndex + 1);
  //  var newVersion = fn(this.history[this.historyIndex]);
  //  this.history.push(newVersion);
  //  this.annotations = this.annotations.push(annotation);
  //  this.historyIndex++;
  //  this._render();
  //}

  getAll() {
    //return this.history[this.historyIndex];
  }

  getAllGeoJSON() {
    //return {
    //  type: 'FeatureCollection',
    //  features: this.history[this.historyIndex].map(feature => feature.getGeoJSON()).toJS()
    //};
    return {
      type: 'FeatureCollection',
      features: Object.keys(this._features).map(k => this._features[k].toGeoJSON())
    };
  }

  get(id) {
    //return this.history[this.historyIndex].find(feature => feature.drawId === id);
    return this._features[id];
  }

  getGeoJSON(id) {
    //return this.get(id).getGeoJSON();
    return this._features[id].toGeoJSON();
  }

  /**
   * Get all features within a given extent
   *
   * @param {LngLatBounds} bounds
   * @private
   */
  //getFeaturesIn(bounds) {
    //var results = [];
    //var features = this.history[this.historyIndex];
    //for (var i = 0; i < features.size; i++) {
    //  var ext = features.get(i).getExtent();
    //  if (bounds.getNorth() < ext.getSouth() ||
    //      bounds.getSouth() > ext.getNorth() ||
    //      bounds.getEast() < ext.getWest() ||
    //      bounds.getWest() > ext.getEast()) {
    //    continue;
    //  } else {
    //    results.push(features.get(i));
    //  }
    //}
    //return results;
  //}

  clear() {
    //this._operation(() => Immutable.List([]), 'remove all geometries');
    this._features = {};
    this._render();
  }

  //clearAll() {
    //this.historyIndex = 0;
    //this.history = [Immutable.fromJS([])];
    //this.annotations = Immutable.List([]);
  //}

  /**
   * @param {Object} feature - GeoJSON feature
   */
  set(feature) {
    //this._operation(data => data.push(feature), 'Added a ' + feature.type);
    this._features[feature.drawId] = feature;
    this._render();
  }

  /**
   * @param {String} id - feature id
   */
  unset(id) {
    //this._operation(data => data.filterNot(d => d.drawId === id), 'removed feature ' + id);
    delete this._feature[id];
    this._render();
  }

  /**
   * @param {String} id - the drawId of a feature
   * @return {Object} - GeoJSON feature
   * @private
   */
  edit(id) {
    // remove it from the store
    //var data = this.history[this.historyIndex];
    //var geometry = data.find(geom => geom.drawId === id);
    //this.history[++this.historyIndex] = data.filterNot(geom => geom.drawId === id);

    //this._render();

    //// add it to the editStore
    //this._editStore.set(geometry);
    this._editStore.set(this._features[id]);
    delete this._features[id];
    this._render();
  }

  //editBatch(drawIds) {
    //var data = this.history[this.historyIndex];
    //var geometries = data.filter(geom => drawIds.indexOf(geom.drawId) > -1);
    //this.history[++this.historyIndex] = data.filterNot(geom => drawIds.indexOf(geom.drawId) > -1);
    //this._editStore.setBatch(geometries);
    //this._render();
  //}

  _render() {
    this._map.fire('draw.feature.update', {
      geojson: this.getAllGeoJSON()
    });
  }

  //redo() {
  //  if (this.historyIndex < this.history.length) this.historyIndex++;
  //}

  //undo() {
  //  if (this.historyIndex > 0) this.historyIndex--;
  //}

}
