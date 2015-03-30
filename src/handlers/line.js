'use strict';

var extend = require('xtend');
var Handlers = require('./handlers');
var util = require('../util');
var DOM = util.DOM;

module.exports = Line;

function Line(map) {
  var options = {
    dashDistance: 20,
    repeatMode: true,
  };

  this.type = 'LineString';
  this.initialize(map, options);
}

Line.prototype = extend(Handlers, {

  drawStart: function() {
    if (this._map) {

      // Container to hold on to an
      // Array points of coordinates
      this._nodes = [];

      this._map.on('click', function(e) {
        this._onClick(e);
      }.bind(this));

      this._map.on('mousedown', function(e) {
        this._onMouseDown(e);
      }.bind(this));

      this._map.on('mousemove', function(e) {
        this._onMouseMove(e);
      }.bind(this));

      this._map.on('mouseUp', function(e) {
        this._onMouseUp(e);
      }.bind(this));

      this._map.on('zoomend', function(e) {
        this._onZoomEnd(e);
      }.bind(this));
    }
  },

  drawStop: function() {
    if (this._map) {
      this._map.off('click', this._onClick);
    }
  },

  _onClick: function(e) {
    var c = this._map.unproject([e.point.x, e.point.y]);
    var point = [c.lng, c.lat];
    this.create(this.type, point);
  },

  _onMouseDown: function(e) {
    this._currentLatLng = this._map.unproject([e.point.x, e.point.y]);
  },

  _onMouseMove: function(e) {
    var newPos = this._map.unproject([e.point.x, e.point.y]);
    this._updateGuide(newPos);
  },

  _onMouseUp: function(e) {
    if (this._currentLatLng) {
      this.addVertex(this._map.unproject([e.point.x, e.point.y]));
    }

    this._currentLatLng = null;
  },

  _createHandles: function(latLng) {
    // 1. TODO Take the current coordinates.
    // 2. unproject and plot a div on the map
    // to act as a interactive control that listens
    // to a click event to complete a path.
    // The click event should respond to this._finishShape();
  },

  _addVertex: function(latLng) {
    this._nodes.push(latLng);
    this._createHandles();
    this._vertexChanged(latLng, true);
  },

  _vertexChanged: function(latLng, added) {
    // this._updateRunningMeasure(latlng, added);
    this._clearGuides();
  },

  _onZoomEnd: function(e) {
    this._updateGuide();
  },

  _updateGuide: function(newPos) {
    if (this._nodes.length) {
      var nodes = this._nodes;
      newPos = newPos || this._map.project(this._currentLatLng);

      this._clearGuides();

      // Draw the new guide line
      this._drawGuide(
        this._map.project(nodes[nodes.length - 1]),
        newPos
      );
    }
  },

  _drawGuide: function(a, b) {
    var length = Math.floor(Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2)));
    var dashDistance = this.options.dashDistance;

    if (!this._guidesContainer) {
      this._guidesContainer = DOM.create('div', 'mapboxgl-draw-guides', this._map.getContainer());
    }

    // Draw a dash every GuildeLineDistance
    var fraction, dashPoint, dash;
    for (var i; i < length; i += dashDistance) {
      // Work out a fraction along line we are
      fraction = i / length;

      // Calculate a new x,y point
      dashPoint = {
        x: Math.floor((a.x * (1 - fraction)) + (fraction * b.x)),
        y: Math.floor((a.y * (1 - fraction)) + (fraction * b.y))
      };

      // Add guide dash to guide container
      dash = DOM.create('div', 'mapboxgl-draw-guide-dash', this._guidesContainer);

      DOM.setTransform(dash, dashPoint);
    }
  },

  _clearGuides: function() {
    if (this._guidesContainer) {
      while (this._guidesContainer.firstChild) {
        this._guidesContainer.removeChild(this._guidesContainer.firstChild);
      }
    }
  }

});
