'use strict';

var extend = require('xtend');
var handlers = require('./handlers');
var DOM = require('../util').DOM;

module.exports = extend(handlers, {

  drawGuide(map, a, b) {
    var length = Math.floor(Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2)));
    var dashDistance = 6;

    if (!this._guidesContainer) {
      this._guidesContainer = DOM.create('div', 'mapboxgl-draw-guides', map.getContainer());
    }

    // Draw a dash every GuildeLineDistance
    for (var i = 0; i < length; i += dashDistance) {

      // Work out a fraction along line we are
      var fraction = i / length;

      // Calculate a new x,y point
      var x = Math.floor((a.x * (1 - fraction)) + (fraction * b.x));
      var y = Math.floor((a.y * (1 - fraction)) + (fraction * b.y));

      // Add guide dash to guide container
      var dash = DOM.create('div', 'mapboxgl-draw-guide-dash', this._guidesContainer);
      DOM.setTransform(dash, 'translate(' + x + 'px,' + y + 'px)');
    }
  },

  clearGuides() {
    if (this._guidesContainer) {
      while (this._guidesContainer.firstChild) {
        this._guidesContainer.removeChild(this._guidesContainer.firstChild);
      }
    }
  }

});
