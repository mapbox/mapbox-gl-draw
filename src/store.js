'use strict';

var Immutable = require('immutable');

function Store(obj) {
  this.historyIndex = 0;
  this.history = [Immutable.List([])];
  this.annotations = [Immutable.List([])];
}

Store.prototype = {

  // http://www.macwright.org/2015/05/18/practical-undo.html
  operation(fn, annotation) {
    this.annotations = this.annotations.slice(0, this.historyIndex + 1);
    this.history = this.history.slice(0, this.historyIndex + 1);
    var newVersion = fn(this.history[this.historyIndex]);
    this.history.push(newVersion);
    this.annotations.push(annotation);
    this.historyIndex++;
  },

  getAll() {
    return {
      type: 'FeatureCollection',
      features: this.history[this.historyIndex].toJS()
    };
  },

  clear() {
    this.historyIndex = 0;
    this.history = [Immutable.List([])];
  },

  get(id) {
    // TODO get a specific geojson object
  },

  unset(type, id) {
   this.operation(function(data) {
    return data.filter(function(feature) {
        return feature.get('id') !== id;
      });
    }, 'Removed a ' + type);
  },

  set(type, id, coords) {
    this.operation(function(data) {
      return data.push(Immutable.Map({
        type: 'Feature',
        properties: {
          id: id
        },
        geometry: {
          type: type,
          coordinates: coords
        }
      }));
    }, 'Added a ' + type);
  },

  redo() {
    // TODO redo management. the function that calls this
    // should follow with a redraw of features.
    if (this.historyIndex < this.history.length) this.historyIndex++;
  },

  undo() {
    // TODO undo management. the function that calls this
    // should follow with a redraw of features.
    if (this.historyIndex > 0) this.historyIndex--;
  }
};

module.exports = Store;
