'use strict';

import Immutable from 'immutable';
import hat from 'hat';

/**
 * A store for keeping track of versions of drawings
 *
 * @param {Array<Object>} data An array of GeoJSON object
 * @returns {Store} this
 */
export default class Store {

  constructor(data, map) {
    this._map = map;
    this.historyIndex = 0;
    this.history = [ Immutable.List([]) ];
    this.annotations = Immutable.List([]);

    if (data.length) {
      data.forEach(d => {
        d.properties.drawId = hat();
        this.history[0] = this.history[0].push(Immutable.fromJS(d));
      });
    }
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
      features: this.history[this.historyIndex].toJS()
    };
  }

  get(id) {
    return this.history[this.historyIndex]
      .find(feature => feature.get('properties').get('drawId') === id).toJS();
  }

  clear() {
    this.operation(() => Immutable.List([]), 'remove all geometries');
  }

  clearAll() {
    this.historyIndex = 0;
    this.history = [Immutable.fromJS([])];
    this.annotations = Immutable.List([]);
  }

  unset(id) {
    this.operation(
      data => data.filterNot(feature => feature.get('properties').get('drawId') === id),
      'Removed a feature'
    );
  }

  /**
   * @param {Object} feature - GeoJSON feature
   */
  set(feature) {
    this.operation(data => {
      feature = Immutable.fromJS(feature);
      feature = feature.setIn(['properties', 'drawId'], hat());

      // Does an index for this exist?
      var updateIndex = this.history[this.historyIndex]
        .findIndex(feat =>
          feat.get('properties').drawId === feature.get('properties').get('drawId')
        );

      return (updateIndex > -1) ?
        data.set(updateIndex, feature) :
        data.push(feature);

    }, 'Added a ' + feature.geometry.type);
  }

  /**
   * @param {String} id - the drawId of a feature
   * @return {Object} - GeoJSON feature
   * @private
   */
  edit(id) {
    this.history.push(this.history[this.historyIndex++]);
    var idx = this.historyIndex;
    var feature = this.history[idx].find(feat => feat.get('properties').get('drawId') === id);
    this.history[idx] = this.history[idx]
      .filterNot(feat => feat.get('properties').get('drawId') === id);

    this.render();
    return feature.toJS();
  }

  render() {
    this._map.fire('draw.feature.update', {
      geojson: this.getAll()
    });
  }

  redo() {
    if (this.historyIndex < this.history.length) this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) this.historyIndex--;
  }

}
