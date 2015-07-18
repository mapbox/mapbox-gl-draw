'use strict';

var Immutable = require('immutable');
var hat = require('hat');

function Store(data) {
  this.historyIndex = 0;

  // Apply an internal ID to any potential added feature
  if (data.length) {
    data.forEach((d) => {
      d.properties._drawid = hat();
    });
  }

  this.history = [Immutable.List([])];
  this.history.push(Immutable.Map(data));

  this.annotations = [Immutable.List([])];

  this.dragging = false;
}

Store.prototype = {

  operation(fn, annotation) {
    // Wrap an operation: Given a function, apply it the history list.
    // via http://www.macwright.org/2015/05/18/practical-undo.html
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

  getById(id) {
    return this.history[this.historyIndex]
      .find(feature => feature.get('properties')._drawid === id);
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

  unset(type, id) {
    this.operation(
      data => data.filterNot(feature => feature.get('properties')._drawid === id),
      'Removed a ' + type
    );
  },

  _findIndex(id) {
    var index;
    this.history[this.historyIndex].forEach((feature, i) => {
      if (feature.get('properties')._drawid === id) index = i;
    });
    return index;
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
      var updateIndex = this._findIndex(id);

      return (updateIndex >= 0) ?
        data.set(updateIndex, feature) :
        data.push(feature);

    }, 'Added a ' + type);
  },

  update(id, feature) {
    if (!this.dragging) {
      // increment history index and add new entry only once at start of drag
      this.history.push(this.history[this.historyIndex++]);
      this.dragging = true;
    }
    var idx = this.historyIndex;
    this.history[idx] = this.history[idx]
      .filterNot(feat => feat.get('properties')._drawid === id);
    this.history[idx] = this.history[idx].push(Immutable.Map(feature));
  },

  redo() {
    if (this.historyIndex < this.history.length) this.historyIndex++;
  },

  undo() {
    if (this.historyIndex > 0) this.historyIndex--;
  }
};

module.exports = Store;
