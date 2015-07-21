'use strict';

var Immutable = require('immutable');
var hat = require('hat');

/**
 * A store for keeping track of versions of drawings
 *
 * @param {Array} data An array of GeoJSON object
 *
 */

function Store(data, map) {
  this._map = map;
  this.historyIndex = 0;
  this.history = [ Immutable.List([]) ];
  this.annotations = Immutable.List([]);

  if (data.length) {
    data.forEach(d => {
      d.properties._drawid = hat();
      this.history[0] = this.history[0].push(Immutable.Map(d));
    });
  }
}

Store.prototype = {

  operation(fn, annotation) {
    // Wrap an operation: Given a function, apply it the history list.
    // via http://www.macwright.org/2015/05/18/practical-undo.html
    this.annotations = this.annotations.slice(0, this.historyIndex + 1);
    this.history = this.history.slice(0, this.historyIndex + 1);
    var newVersion = fn(this.history[this.historyIndex]);
    this.history.push(newVersion);
    this.annotations = this.annotations.push(annotation);
    this.historyIndex++;
  },

  getAll() {
    return {
      type: 'FeatureCollection',
      features: this.history[this.historyIndex].toJS()
    };
  },

  getById(id) {
    return this.history[this.historyIndex]
      .find(feature => feature.get('properties')._drawid === id).toJS();
  },

  clear() {
    // TODO Iterate down historyIndex instead.
    this.historyIndex = 0;
    this.history = [Immutable.List([])];
  },

  get(id) {
    var current = this.history[this.historyIndex];
    return current.filter((feature) => {
      return feature.get('properties')._drawid === id;
    });
  },

  unset(id) {
    this.operation(
      data => data.filterNot(feature => feature.get('properties')._drawid === id),
      'Removed a feature'
    );

    this._map.fire('draw.feature.update', {
      geojson: this.getAll()
    });
  },

  set(type, id, coords) {
    this.operation((data) => {
      var feature = Immutable.Map({
        type: 'Feature',
        properties: {
          _drawid: id
        },
        geometry: {
          type: type,
          coordinates: coords
        }
      });

      // Does an index for this exist?
      var updateIndex = this.history[this.historyIndex]
        .findIndex(feat => feat.get('properties')._drawid === id);

      return (updateIndex > -1) ?
        data.set(updateIndex, feature) :
        data.push(feature);

    }, 'Added a ' + type);

    this._map.fire('draw.feature.update', {
      geojson: this.getAll()
    });
  },

  edit(id) {
    this.history.push(this.history[this.historyIndex++]);
    var idx = this.historyIndex;
    var feature = this.history[idx].find(feat => feat.get('properties')._drawid === id);
    this.history[idx] = this.history[idx]
      .filterNot(feat => feat.get('properties')._drawid === id);
    return feature.toJS();
  },

  save(features) {
    var idx = this.historyIndex;
    features.features.forEach(feat => {
      this.history[idx] = this.history[idx].push(Immutable.Map(feat));
    });
    this.annonatations = this.annotations.push('editted features');
  },

  redo() {
    if (this.historyIndex < this.history.length) this.historyIndex++;
  },

  undo() {
    if (this.historyIndex > 0) this.historyIndex--;
  }
};

module.exports = Store;
