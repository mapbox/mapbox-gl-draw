'use strict';

var Immutable = require('immutable');
var EditStore = require('../edit_store');
var { translate } = require('../util');

module.exports = {

  /**
   * Initializes geometries
   *
   * @param {Object} map - Instancce of MapboxGL Map
   * @param {Object} drawStore - Overall store for session
   * @param {String} type - Type of GeoJSON geometry
   * @param {Object} data - GeoJSON feature
   */
  initialize(map, drawStore, type, data) {
    this._map = map;
    this.drawStore = drawStore;
    this.coordinates = Immutable.fromJS(data ? data.geometry.coordinates : []);

    this.feature = Immutable.fromJS({
      type: 'Feature',
      properties: {
        _drawid: data ? data.properties._drawid : null
      },
      geometry: {
        type: type,
        coordinates: this.coordinates.toJS()
      }
    });

    this.store = new EditStore(this._map, [ this.feature.toJS() ]);
  },

  /**
   * @return {Object} GeoJSON feature
   */
  get() {
    return this.feature.toJS();
  },

  /**
   * Called after a draw is done
   */
  _done(type) {
    this.store.clear();
    this.drawStore.set(this.feature.toJS());
    this._map.fire('draw.end', { featureType: type });
  },

  /**
   * Clear the edit drawings and render the changes to the main draw layer
   */
  completeEdit() {
    this.store.clear();
    this.drawStore.set(this.feature.toJS());
    this._map.fire('edit.end');
  },

  /**
   * Translate this polygon
   *
   * @param {Array<Number>} init - Mouse position at the beginining of the drag
   * @param {Array<Number>} curr - Current mouse position
   */
  translate(init, curr) {
    if (!this.translating) {
      this.translating = true;
      this.initGeom = Immutable.fromJS(this.feature.toJS());
    }
    this.feature = Immutable.fromJS(translate(this.initGeom.toJS(), init, curr, this._map));
    this.store.update(this.feature.toJS());
  }
};

