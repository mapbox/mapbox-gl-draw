'use strict';

var Control = require('./control');
var DOM = require('./dom');
var util = require('./util');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = util.inherit(Control, {
  options: {
    position: 'topleft'
  },

  onAdd: function(map) {
    var className = 'mapboxgl-ctrl-nav';
    var container = this._container = DOM.create('div', className, map.getContainer());
    return container;
  }
});
