'use strict';

let extend = require('xtend');
let Handlers = require('./handlers');
let util = require('../util');
let DOM = util.DOM;

function Line(map) {
  var options = {
    dashDistance: 20,
    repeatMode: true,
  };

  this.type = 'LineString';
  this.initialize(map, options);
}

Line.prototype = extend(Handlers, {

  drawStart() {
    if (this._map) {

      // Container to hold on to an
      // Array points of coordinates
      this._nodes = [];
      var container = this._map.getContainer();

      container.addEventListener('mousedown', function(e) {
        this._onMouseDown(e);
      }.bind(this));

      container.addEventListener('mousemove', function(e) {
        this._onMouseMove(e);
      }.bind(this));

      container.addEventListener('mouseup', function(e) {
        this._onMouseUp(e);
      }.bind(this));

      this._map.on('zoomend', function(e) {
        this._onZoomEnd(e);
      }.bind(this));
    }
  },

  drawStop() {
    if (this._map) {
      this._map.off('click', this._onClick);
    }
  },

  _onClick(e) {
    // var c = this._map.unproject([e.point.x, e.point.y]);
    // var point = [c.lng, c.lat];
    // this.create(this.type, point);
  },

  _onMouseDown(e) {
    var point = this._mousePos(e);
    this._currentLatLng = this._map.unproject([point.x, point.y]);
  },

  _onMouseMove(e) {
    if (this._currentLatLng) {
      var point = this._mousePos(e);
      var newPos = this._map.unproject([point.x, point.y]);
      this._updateGuide(newPos);
    }
  },

  _onMouseUp(e) {
    if (this._currentLatLng) {
      var point = this._mousePos(e);
      this._addVertex(this._map.unproject([point.x, point.y]));
    }

    this._currentLatLng = null;
  },

  _mousePos(e) {
    var el = this._map.getContainer();
    var rect = el.getBoundingClientRect();
    return new mapboxgl.Point(
      e.clientX - rect.left - el.clientLeft,
      e.clientY - rect.top - el.clientTop
    );
  },

  _createHandles(latLng) {
    // 1. TODO Take the current coordinates.
    // 2. unproject and plot a div on the map
    // to act as a interactive control that listens
    // to a click event to complete a path.
    // The click event should respond to this._finishShape();
  },

  _addVertex(latLng) {
    this._nodes.push(latLng);
    this._createHandles();
    this._vertexChanged(latLng, true);
  },

  _vertexChanged(latLng, added) {
    // this._updateRunningMeasure(latlng, added);
    this._clearGuides();
  },

  _onZoomEnd(e) {
    this._updateGuide();
  },

  _updateGuide(newPos) {
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

  _drawGuide(a, b) {
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

  _clearGuides() {
    if (this._guidesContainer) {
      while (this._guidesContainer.firstChild) {
        this._guidesContainer.removeChild(this._guidesContainer.firstChild);
      }
    }
  }

});

module.exports = Line;
