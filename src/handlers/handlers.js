'use strict';

var util = require('../util');
var store = require('../store');

module.exports = {

	initialize: function(map, options) {
		this._map = map;
		this._container = map.getContainer();
		util.setOptions(this, options);
    this.enable();
	},

	enable: function() {
		var map = this._map;
		if (map) {
			util.DOM.disableSelection();
			map.getContainer().focus();
      this._container.addEventListener('keyup', this._cancelDrawing.bind(this));
      this._container.classList.add('mapboxgl-draw-activated');
      this._map.fire('draw.start', { featureType: this.type });
      this.drawStart();
		}
	},

	disable: function() {
		if (this._map) {
			util.DOM.enableSelection();
      this._container.removeEventListener('keyup', this._cancelDrawing.bind(this));
      this._container.classList.remove('mapboxgl-draw-activated');
      this._map.fire('draw.stop', { featureType: this.type });
      this.drawStop();
		}
	},

  create: function(type, coordinates) {
    var feature = store.set(type, coordinates);
    this._map.fire('draw.feature.created', {geojson: store.getAll()});
		this._created(feature);
		if (!this.options.repeatMode) this.disable();
  },

	_created: function(feature) {
		this._map.fire('draw.created', {
      featureType: this.type,
      feature: feature
    });
	},

	_cancelDrawing: function(e) {
		if (e.keyCode === 27) { // esc
			this.disable();
		}
	}
};
