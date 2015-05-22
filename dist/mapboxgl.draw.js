(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/tristen/dev/mapbox/gl-draw/index.js":[function(require,module,exports){
`use strict`;

/** A drawing component for mapboxgl
 * @class mapbox.Draw
 *
 * @param {Object} options
 * @param {String} [options.position=top-right] A string indicating the control's position on the map. Options are `topright`, `topleft`, `bottomright`, `bottomleft`
 * @returns {Draw} `this`
 * @example
 * var map = new mapboxgl.Map({
 *   container: 'map',
 *   style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json'
 * });
 *
 * // Initialize the drawing component
 * map.addControl(new mapboxgl.Draw());
 */
mapboxgl.Draw = require('./src/draw.js');

},{"./src/draw.js":"/Users/tristen/dev/mapbox/gl-draw/src/draw.js"}],"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js":[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/control.js":[function(require,module,exports){
'use strict';

module.exports = {

  addTo: function(map) {
    this._map = map;
    var container = this._container = this.onAdd(map);
    if (this.options && this.options.position) {
      var pos = this.options.position;
      var corner = map._controlCorners[pos];
      container.className += ' mapboxgl-ctrl-draw mapboxgl-ctrl';

      if (pos.indexOf('bottom') !== -1) {
        corner.insertBefore(container, corner.firstChild);
      } else {
        corner.appendChild(container);
      }
    }

    return this;
  },

  remove: function() {
    this._container.parentNode.removeChild(this._container);
    if (this.onRemove) this.onRemove(this._map);
    this._map = null;
    return this;
  }
};

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/draw.js":[function(require,module,exports){
'use strict';

/* global mapboxgl */

var extend = require('xtend');
var Control = require('./control');
var theme = require('./theme');
var util = require('./util');
var DOM = util.DOM;

// Control handlers
var Polygon = require('./handlers/polygon');
var Line = require('./handlers/line');
var Circle = require('./handlers/circle');
var Square = require('./handlers/square');
var Point = require('./handlers/point');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = extend(Control, {
  options: {
    position: 'top-left',
    controls: {
      marker: true,
      line: true,
      shape: true,
      square: true,
      circle: true
    }
  },

  onAdd: function(map) {
    var controlClass = this._controlClass = 'mapboxgl-ctrl-draw-btn';
    var container = this._container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
    var controls = this.options.controls;

    if (controls.shape) this._createButton(controlClass + ' shape', 'Shape tool', this._drawPolygon.bind(map));
    if (controls.line) this._createButton(controlClass + ' line', 'Line tool', this._drawLine.bind(map));
    if (controls.circle) this._createButton(controlClass + ' circle', 'Circle tool', this._drawCircle.bind(map));
    if (controls.square) this._createButton(controlClass + ' square', 'Rectangle tool', this._drawSquare.bind(map));
    if (controls.marker) this._createButton(controlClass + ' marker', 'Marker tool', this._drawPoint.bind(map));

    this._mapState(map);
    return container;
  },

  _drawPolygon: function() {
    // TODO should this._map, & this.options.polygon be passed?
    new Polygon(this);
  },

  _drawLine: function() {
    new Line(this);
  },

  _drawCircle: function() {
    new Circle(this);
  },

  _drawSquare: function() {
    new Square(this);
  },

  _drawPoint: function() {
    new Point(this);
  },

  _createButton: function(className, title, fn) {
    var a = DOM.create('button', className, this._container, {
      title: title
    });

    var controlClass = this._controlClass;
    var map = this._map;

    a.addEventListener('click', function(e) {
      e.preventDefault();

      // Cancel any initialized handlers
      map.fire('draw.cancel');

      if (this.classList.contains('active')) {
        this.classList.remove('active');
      } else {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        this.classList.add('active');
        fn();
      }
    });

    return a;
  },

  _mapState: function(map) {
    var drawLayer;
    var controlClass = this._controlClass;

    map.on('load', function() {

      map.on('draw.stop', function(e) {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
      });

      map.on('draw.feature.created', function(e) {
        if (drawLayer) {
          drawLayer.setData(e.geojson);
        } else {
          drawLayer = new mapboxgl.GeoJSONSource({
            data: e.geojson
          });

          map.addSource('draw', drawLayer);

          theme.forEach(function(style) {
            map.addLayer(style);
          });
        }
      });

    });
  }
});

},{"./control":"/Users/tristen/dev/mapbox/gl-draw/src/control.js","./handlers/circle":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/circle.js","./handlers/line":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/line.js","./handlers/point":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/point.js","./handlers/polygon":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/polygon.js","./handlers/square":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/square.js","./theme":"/Users/tristen/dev/mapbox/gl-draw/src/theme.js","./util":"/Users/tristen/dev/mapbox/gl-draw/src/util.js","xtend":"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/circle.js":[function(require,module,exports){
'use strict';

module.exports = Circle;

function Circle(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/handlers.js":[function(require,module,exports){
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

      this._map.on('draw.cancel', this.disable.bind(this));
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
      this._map.fire('draw.cancel');
    }
  }
};

},{"../store":"/Users/tristen/dev/mapbox/gl-draw/src/store.js","../util":"/Users/tristen/dev/mapbox/gl-draw/src/util.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/line.js":[function(require,module,exports){
'use strict';

/* global mapboxgl */

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

  drawStop: function() {
    if (this._map) {
      this._map.off('click', this._onClick);
    }
  },

  _onClick: function(e) {
    // var c = this._map.unproject([e.point.x, e.point.y]);
    // var point = [c.lng, c.lat];
    // this.create(this.type, point);
  },

  _onMouseDown: function(e) {
    var point = this._mousePos(e);
    this._currentLatLng = this._map.unproject([point.x, point.y]);
  },

  _onMouseMove: function(e) {
    if (this._currentLatLng) {
      var point = this._mousePos(e);
      var newPos = this._map.unproject([point.x, point.y]);
      this._updateGuide(newPos);
    }
  },

  _onMouseUp: function(e) {
    if (this._currentLatLng) {
      var point = this._mousePos(e);
      this._addVertex(this._map.unproject([point.x, point.y]));
    }

    this._currentLatLng = null;
  },

  _mousePos: function(e) {
    var el = this._map.getContainer();
    var rect = el.getBoundingClientRect();
    return new mapboxgl.Point(
      e.clientX - rect.left - el.clientLeft,
      e.clientY - rect.top - el.clientTop
    );
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

},{"../util":"/Users/tristen/dev/mapbox/gl-draw/src/util.js","./handlers":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/handlers.js","xtend":"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/point.js":[function(require,module,exports){
'use strict';

var extend = require('xtend');
var Handlers = require('./handlers');

module.exports = Point;

function Point(map) {
  var options = {
    repeatMode: true
  };

  this.type = 'Point';
  this.initialize(map, options);
}

Point.prototype = extend(Handlers, {

  drawStart: function() {
    if (this._map) {
      this._map.on('click', function(e) {
        this._onClick(e);
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
  }

});

},{"./handlers":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/handlers.js","xtend":"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/polygon.js":[function(require,module,exports){
'use strict';

var extend = require('xtend');
var Line = require('./line');

module.exports = Polygon;

function Polygon(map) {
  var options = {
    repeatMode: true
  };

  this.type = 'Polygon';
  this.initialize(map, options);
}

Polygon.prototype = extend(Line, {

  drawStart: function() {},

  drawStop: function() {},

  _onClick: function(e) {}

});

},{"./line":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/line.js","xtend":"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/square.js":[function(require,module,exports){
'use strict';

module.exports = Square;

function Square(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/store.js":[function(require,module,exports){
'use strict';

module.exports = {

  getAll: function() {
    return this._data;
  },

  get: function() {
    // TODO get a specific geojson object
  },

  unset: function() {
    // TODO undo management.
    this._history = this.getAll().features;
    // TODO remove a specific geojson object
  },

  set: function(type, coordinates) {

    var obj = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: type,
        coordinates: coordinates
      }
    };

    this._data.features.push(obj);
    return obj;
  },

  _data: {
    type: 'FeatureCollection',
    features: []
  }
};

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/theme.js":[function(require,module,exports){
module.exports = [
  {
    "id": "gl-draw-points",
    "type": "symbol",
    "source": "draw",
    "filter": ["all", ["==", "$type", "Point"]],
    "layout": {
      "icon-image": "marker-12",
      "text-anchor": "top",
      "icon-allow-overlap": true
    },
    "paint": {
      "icon-color": "#f1f075",
      "icon-size": 2
    }
  }, {
    "id": "gl-draw-polygons",
    "type": "fill",
    "source": "draw",
    "filter": ["all", ["==", "$type", "Polygon"]],
    "paint": {
      "fill-color": "#56b881",
      "fill-outline-color": "#56b881",
      "fill-opacity": 0.5
    }
  }, {
    "id": "gl-draw-polygon-stroke",
    "type": "line",
    "source": "draw",
    "filter": ["all", ["==", "$type", "Polygon"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#56b881",
      "line-width": 2
    }
  }, {
    "id": "gl-draw-line",
    "type": "line",
    "source": "draw",
    "filter": ["all", ["==", "$type", "LineString"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#8a8acb",
      "line-width": 4
    }
  }
];

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/util.js":[function(require,module,exports){
'use strict';

/* Merge user provided options object with a default one
 *
 * @param {Object} obj Containing an options key with which to merge
 * @param {options} options Provided options with which to merge
 * @returns {Object}
 */
module.exports.setOptions = function(obj, options) {
    if (!obj.hasOwnProperty('options')) {
        obj.options = obj.options ? Object.create(obj.options) : {};
    }
    for (var i in options) {
        obj.options[i] = options[i];
    }
    return obj.options;
};

module.exports.DOM = {};

/* Builds DOM elements
 *
 * @param {String} tag Element name
 * @param {String} [className]
 * @param {Object} [container] DOM element to append to
 * @param {Object} [attrbutes] Object containing attributes to apply to an
 * element. Attribute name corresponds to the key.
 * @returns {el} The dom element
 */
module.exports.DOM.create = function(tag, className, container, attributes) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (attributes) {
    for (var key in attributes) {
      el.setAttribute(key, attributes[key]);
    }
  }
  if (container) container.appendChild(el);
  return el;
};

/* Removes classes from an array of DOM elements
 *
 * @param {HTMLElement} elements
 * @param {String} klass
 */
module.exports.DOM.removeClass = function(elements, klass) {
  Array.prototype.forEach.call(elements, function(el) {
    el.classList.remove(klass);
  });
};

var docStyle = document.documentElement.style;

function testProp(props) {
  for (var i = 0; i < props.length; i++) {
    if (props[i] in docStyle) {
      return props[i];
    }
  }
}

var selectProp = testProp([
  'userSelect',
  'MozUserSelect',
  'WebkitUserSelect',
  'msUserSelect'
]);

var transformProp = testProp([
  'transform',
  'WebkitTransform'
]);

module.exports.setTransform = function(el, value) {
  el.style[transformProp] = value;
};

var userSelect;
module.exports.DOM.disableSelection = function() {
  if (selectProp) {
    userSelect = docStyle[selectProp];
    docStyle[selectProp] = 'none';
  }
};

module.exports.DOM.enableSelection = function() {
  if (selectProp) {
    docStyle[selectProp] = userSelect;
  }
};

},{}]},{},["/Users/tristen/dev/mapbox/gl-draw/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kcmF3LmpzIiwic3JjL2hhbmRsZXJzL2NpcmNsZS5qcyIsInNyYy9oYW5kbGVycy9oYW5kbGVycy5qcyIsInNyYy9oYW5kbGVycy9saW5lLmpzIiwic3JjL2hhbmRsZXJzL3BvaW50LmpzIiwic3JjL2hhbmRsZXJzL3BvbHlnb24uanMiLCJzcmMvaGFuZGxlcnMvc3F1YXJlLmpzIiwic3JjL3N0b3JlLmpzIiwic3JjL3RoZW1lLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImB1c2Ugc3RyaWN0YDtcblxuLyoqIEEgZHJhd2luZyBjb21wb25lbnQgZm9yIG1hcGJveGdsXG4gKiBAY2xhc3MgbWFwYm94LkRyYXdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLnBvc2l0aW9uPXRvcC1yaWdodF0gQSBzdHJpbmcgaW5kaWNhdGluZyB0aGUgY29udHJvbCdzIHBvc2l0aW9uIG9uIHRoZSBtYXAuIE9wdGlvbnMgYXJlIGB0b3ByaWdodGAsIGB0b3BsZWZ0YCwgYGJvdHRvbXJpZ2h0YCwgYGJvdHRvbWxlZnRgXG4gKiBAcmV0dXJucyB7RHJhd30gYHRoaXNgXG4gKiBAZXhhbXBsZVxuICogdmFyIG1hcCA9IG5ldyBtYXBib3hnbC5NYXAoe1xuICogICBjb250YWluZXI6ICdtYXAnLFxuICogICBzdHlsZTogJ2h0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LWdsLXN0eWxlcy9zdHlsZXMvb3V0ZG9vcnMtdjcuanNvbidcbiAqIH0pO1xuICpcbiAqIC8vIEluaXRpYWxpemUgdGhlIGRyYXdpbmcgY29tcG9uZW50XG4gKiBtYXAuYWRkQ29udHJvbChuZXcgbWFwYm94Z2wuRHJhdygpKTtcbiAqL1xubWFwYm94Z2wuRHJhdyA9IHJlcXVpcmUoJy4vc3JjL2RyYXcuanMnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGFkZFRvOiBmdW5jdGlvbihtYXApIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lciA9IHRoaXMub25BZGQobWFwKTtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5wb3NpdGlvbikge1xuICAgICAgdmFyIHBvcyA9IHRoaXMub3B0aW9ucy5wb3NpdGlvbjtcbiAgICAgIHZhciBjb3JuZXIgPSBtYXAuX2NvbnRyb2xDb3JuZXJzW3Bvc107XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgbWFwYm94Z2wtY3RybC1kcmF3IG1hcGJveGdsLWN0cmwnO1xuXG4gICAgICBpZiAocG9zLmluZGV4T2YoJ2JvdHRvbScpICE9PSAtMSkge1xuICAgICAgICBjb3JuZXIuaW5zZXJ0QmVmb3JlKGNvbnRhaW5lciwgY29ybmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29ybmVyLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgIGlmICh0aGlzLm9uUmVtb3ZlKSB0aGlzLm9uUmVtb3ZlKHRoaXMuX21hcCk7XG4gICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIG1hcGJveGdsICovXG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpO1xudmFyIENvbnRyb2wgPSByZXF1aXJlKCcuL2NvbnRyb2wnKTtcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgRE9NID0gdXRpbC5ET007XG5cbi8vIENvbnRyb2wgaGFuZGxlcnNcbnZhciBQb2x5Z29uID0gcmVxdWlyZSgnLi9oYW5kbGVycy9wb2x5Z29uJyk7XG52YXIgTGluZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvbGluZScpO1xudmFyIENpcmNsZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvY2lyY2xlJyk7XG52YXIgU3F1YXJlID0gcmVxdWlyZSgnLi9oYW5kbGVycy9zcXVhcmUnKTtcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvcG9pbnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmF3O1xuXG5mdW5jdGlvbiBEcmF3KG9wdGlvbnMpIHtcbiAgdXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5EcmF3LnByb3RvdHlwZSA9IGV4dGVuZChDb250cm9sLCB7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcC1sZWZ0JyxcbiAgICBjb250cm9sczoge1xuICAgICAgbWFya2VyOiB0cnVlLFxuICAgICAgbGluZTogdHJ1ZSxcbiAgICAgIHNoYXBlOiB0cnVlLFxuICAgICAgc3F1YXJlOiB0cnVlLFxuICAgICAgY2lyY2xlOiB0cnVlXG4gICAgfVxuICB9LFxuXG4gIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgY29udHJvbENsYXNzID0gdGhpcy5fY29udHJvbENsYXNzID0gJ21hcGJveGdsLWN0cmwtZHJhdy1idG4nO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwYm94Z2wtY3RybC1ncm91cCcsIG1hcC5nZXRDb250YWluZXIoKSk7XG4gICAgdmFyIGNvbnRyb2xzID0gdGhpcy5vcHRpb25zLmNvbnRyb2xzO1xuXG4gICAgaWYgKGNvbnRyb2xzLnNoYXBlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBzaGFwZScsICdTaGFwZSB0b29sJywgdGhpcy5fZHJhd1BvbHlnb24uYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMubGluZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgbGluZScsICdMaW5lIHRvb2wnLCB0aGlzLl9kcmF3TGluZS5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5jaXJjbGUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIGNpcmNsZScsICdDaXJjbGUgdG9vbCcsIHRoaXMuX2RyYXdDaXJjbGUuYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMuc3F1YXJlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBzcXVhcmUnLCAnUmVjdGFuZ2xlIHRvb2wnLCB0aGlzLl9kcmF3U3F1YXJlLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLm1hcmtlcikgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgbWFya2VyJywgJ01hcmtlciB0b29sJywgdGhpcy5fZHJhd1BvaW50LmJpbmQobWFwKSk7XG5cbiAgICB0aGlzLl9tYXBTdGF0ZShtYXApO1xuICAgIHJldHVybiBjb250YWluZXI7XG4gIH0sXG5cbiAgX2RyYXdQb2x5Z29uOiBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPIHNob3VsZCB0aGlzLl9tYXAsICYgdGhpcy5vcHRpb25zLnBvbHlnb24gYmUgcGFzc2VkP1xuICAgIG5ldyBQb2x5Z29uKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3TGluZTogZnVuY3Rpb24oKSB7XG4gICAgbmV3IExpbmUodGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdDaXJjbGU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBDaXJjbGUodGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdTcXVhcmU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBTcXVhcmUodGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdQb2ludDogZnVuY3Rpb24oKSB7XG4gICAgbmV3IFBvaW50KHRoaXMpO1xuICB9LFxuXG4gIF9jcmVhdGVCdXR0b246IGZ1bmN0aW9uKGNsYXNzTmFtZSwgdGl0bGUsIGZuKSB7XG4gICAgdmFyIGEgPSBET00uY3JlYXRlKCdidXR0b24nLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lciwge1xuICAgICAgdGl0bGU6IHRpdGxlXG4gICAgfSk7XG5cbiAgICB2YXIgY29udHJvbENsYXNzID0gdGhpcy5fY29udHJvbENsYXNzO1xuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG5cbiAgICBhLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAvLyBDYW5jZWwgYW55IGluaXRpYWxpemVkIGhhbmRsZXJzXG4gICAgICBtYXAuZmlyZSgnZHJhdy5jYW5jZWwnKTtcblxuICAgICAgaWYgKHRoaXMuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgRE9NLnJlbW92ZUNsYXNzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29udHJvbENsYXNzKSwgJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICBmbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGE7XG4gIH0sXG5cbiAgX21hcFN0YXRlOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgZHJhd0xheWVyO1xuICAgIHZhciBjb250cm9sQ2xhc3MgPSB0aGlzLl9jb250cm9sQ2xhc3M7XG5cbiAgICBtYXAub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgbWFwLm9uKCdkcmF3LnN0b3AnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIERPTS5yZW1vdmVDbGFzcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbnRyb2xDbGFzcyksICdhY3RpdmUnKTtcbiAgICAgIH0pO1xuXG4gICAgICBtYXAub24oJ2RyYXcuZmVhdHVyZS5jcmVhdGVkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZHJhd0xheWVyKSB7XG4gICAgICAgICAgZHJhd0xheWVyLnNldERhdGEoZS5nZW9qc29uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkcmF3TGF5ZXIgPSBuZXcgbWFwYm94Z2wuR2VvSlNPTlNvdXJjZSh7XG4gICAgICAgICAgICBkYXRhOiBlLmdlb2pzb25cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG1hcC5hZGRTb3VyY2UoJ2RyYXcnLCBkcmF3TGF5ZXIpO1xuXG4gICAgICAgICAgdGhlbWUuZm9yRWFjaChmdW5jdGlvbihzdHlsZSkge1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKHN0eWxlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2lyY2xlO1xuXG5mdW5jdGlvbiBDaXJjbGUobWFwKSB7XG4gIGNvbnNvbGUubG9nKG1hcCk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24obWFwLCBvcHRpb25zKSB7XG4gICAgdGhpcy5fbWFwID0gbWFwO1xuICAgIHRoaXMuX2NvbnRhaW5lciA9IG1hcC5nZXRDb250YWluZXIoKTtcbiAgICB1dGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5lbmFibGUoKTtcbiAgfSxcblxuICBlbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgaWYgKG1hcCkge1xuICAgICAgdXRpbC5ET00uZGlzYWJsZVNlbGVjdGlvbigpO1xuICAgICAgbWFwLmdldENvbnRhaW5lcigpLmZvY3VzKCk7XG4gICAgICB0aGlzLl9jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9jYW5jZWxEcmF3aW5nLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ21hcGJveGdsLWRyYXctYWN0aXZhdGVkJyk7XG4gICAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5zdGFydCcsIHsgZmVhdHVyZVR5cGU6IHRoaXMudHlwZSB9KTtcbiAgICAgIHRoaXMuZHJhd1N0YXJ0KCk7XG5cbiAgICAgIHRoaXMuX21hcC5vbignZHJhdy5jYW5jZWwnLCB0aGlzLmRpc2FibGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9LFxuXG4gIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgIHV0aWwuRE9NLmVuYWJsZVNlbGVjdGlvbigpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fY2FuY2VsRHJhd2luZy5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdtYXBib3hnbC1kcmF3LWFjdGl2YXRlZCcpO1xuICAgICAgdGhpcy5fbWFwLmZpcmUoJ2RyYXcuc3RvcCcsIHsgZmVhdHVyZVR5cGU6IHRoaXMudHlwZSB9KTtcbiAgICAgIHRoaXMuZHJhd1N0b3AoKTtcbiAgICB9XG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbih0eXBlLCBjb29yZGluYXRlcykge1xuICAgIHZhciBmZWF0dXJlID0gc3RvcmUuc2V0KHR5cGUsIGNvb3JkaW5hdGVzKTtcbiAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5mZWF0dXJlLmNyZWF0ZWQnLCB7Z2VvanNvbjogc3RvcmUuZ2V0QWxsKCl9KTtcbiAgICB0aGlzLl9jcmVhdGVkKGZlYXR1cmUpO1xuICAgIGlmICghdGhpcy5vcHRpb25zLnJlcGVhdE1vZGUpIHRoaXMuZGlzYWJsZSgpO1xuICB9LFxuXG4gIF9jcmVhdGVkOiBmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgdGhpcy5fbWFwLmZpcmUoJ2RyYXcuY3JlYXRlZCcsIHtcbiAgICAgIGZlYXR1cmVUeXBlOiB0aGlzLnR5cGUsXG4gICAgICBmZWF0dXJlOiBmZWF0dXJlXG4gICAgfSk7XG4gIH0sXG5cbiAgX2NhbmNlbERyYXdpbmc6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAyNykgeyAvLyBlc2NcbiAgICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LmNhbmNlbCcpO1xuICAgIH1cbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIG1hcGJveGdsICovXG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpO1xudmFyIEhhbmRsZXJzID0gcmVxdWlyZSgnLi9oYW5kbGVycycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgRE9NID0gdXRpbC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gTGluZTtcblxuZnVuY3Rpb24gTGluZShtYXApIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgZGFzaERpc3RhbmNlOiAyMCxcbiAgICByZXBlYXRNb2RlOiB0cnVlLFxuICB9O1xuXG4gIHRoaXMudHlwZSA9ICdMaW5lU3RyaW5nJztcbiAgdGhpcy5pbml0aWFsaXplKG1hcCwgb3B0aW9ucyk7XG59XG5cbkxpbmUucHJvdG90eXBlID0gZXh0ZW5kKEhhbmRsZXJzLCB7XG5cbiAgZHJhd1N0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG5cbiAgICAgIC8vIENvbnRhaW5lciB0byBob2xkIG9uIHRvIGFuXG4gICAgICAvLyBBcnJheSBwb2ludHMgb2YgY29vcmRpbmF0ZXNcbiAgICAgIHRoaXMuX25vZGVzID0gW107XG4gICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5fbWFwLmdldENvbnRhaW5lcigpO1xuXG4gICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbk1vdXNlRG93bihlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uTW91c2VNb3ZlKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uTW91c2VVcChlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgIHRoaXMuX21hcC5vbignem9vbWVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5fb25ab29tRW5kKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH0sXG5cbiAgZHJhd1N0b3A6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2NsaWNrJywgdGhpcy5fb25DbGljayk7XG4gICAgfVxuICB9LFxuXG4gIF9vbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgLy8gdmFyIGMgPSB0aGlzLl9tYXAudW5wcm9qZWN0KFtlLnBvaW50LngsIGUucG9pbnQueV0pO1xuICAgIC8vIHZhciBwb2ludCA9IFtjLmxuZywgYy5sYXRdO1xuICAgIC8vIHRoaXMuY3JlYXRlKHRoaXMudHlwZSwgcG9pbnQpO1xuICB9LFxuXG4gIF9vbk1vdXNlRG93bjogZnVuY3Rpb24oZSkge1xuICAgIHZhciBwb2ludCA9IHRoaXMuX21vdXNlUG9zKGUpO1xuICAgIHRoaXMuX2N1cnJlbnRMYXRMbmcgPSB0aGlzLl9tYXAudW5wcm9qZWN0KFtwb2ludC54LCBwb2ludC55XSk7XG4gIH0sXG5cbiAgX29uTW91c2VNb3ZlOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRMYXRMbmcpIHtcbiAgICAgIHZhciBwb2ludCA9IHRoaXMuX21vdXNlUG9zKGUpO1xuICAgICAgdmFyIG5ld1BvcyA9IHRoaXMuX21hcC51bnByb2plY3QoW3BvaW50LngsIHBvaW50LnldKTtcbiAgICAgIHRoaXMuX3VwZGF0ZUd1aWRlKG5ld1Bvcyk7XG4gICAgfVxuICB9LFxuXG4gIF9vbk1vdXNlVXA6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudExhdExuZykge1xuICAgICAgdmFyIHBvaW50ID0gdGhpcy5fbW91c2VQb3MoZSk7XG4gICAgICB0aGlzLl9hZGRWZXJ0ZXgodGhpcy5fbWFwLnVucHJvamVjdChbcG9pbnQueCwgcG9pbnQueV0pKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jdXJyZW50TGF0TG5nID0gbnVsbDtcbiAgfSxcblxuICBfbW91c2VQb3M6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgZWwgPSB0aGlzLl9tYXAuZ2V0Q29udGFpbmVyKCk7XG4gICAgdmFyIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4gbmV3IG1hcGJveGdsLlBvaW50KFxuICAgICAgZS5jbGllbnRYIC0gcmVjdC5sZWZ0IC0gZWwuY2xpZW50TGVmdCxcbiAgICAgIGUuY2xpZW50WSAtIHJlY3QudG9wIC0gZWwuY2xpZW50VG9wXG4gICAgKTtcbiAgfSxcblxuICBfY3JlYXRlSGFuZGxlczogZnVuY3Rpb24obGF0TG5nKSB7XG4gICAgLy8gMS4gVE9ETyBUYWtlIHRoZSBjdXJyZW50IGNvb3JkaW5hdGVzLlxuICAgIC8vIDIuIHVucHJvamVjdCBhbmQgcGxvdCBhIGRpdiBvbiB0aGUgbWFwXG4gICAgLy8gdG8gYWN0IGFzIGEgaW50ZXJhY3RpdmUgY29udHJvbCB0aGF0IGxpc3RlbnNcbiAgICAvLyB0byBhIGNsaWNrIGV2ZW50IHRvIGNvbXBsZXRlIGEgcGF0aC5cbiAgICAvLyBUaGUgY2xpY2sgZXZlbnQgc2hvdWxkIHJlc3BvbmQgdG8gdGhpcy5fZmluaXNoU2hhcGUoKTtcbiAgfSxcblxuICBfYWRkVmVydGV4OiBmdW5jdGlvbihsYXRMbmcpIHtcbiAgICB0aGlzLl9ub2Rlcy5wdXNoKGxhdExuZyk7XG4gICAgdGhpcy5fY3JlYXRlSGFuZGxlcygpO1xuICAgIHRoaXMuX3ZlcnRleENoYW5nZWQobGF0TG5nLCB0cnVlKTtcbiAgfSxcblxuICBfdmVydGV4Q2hhbmdlZDogZnVuY3Rpb24obGF0TG5nLCBhZGRlZCkge1xuICAgIC8vIHRoaXMuX3VwZGF0ZVJ1bm5pbmdNZWFzdXJlKGxhdGxuZywgYWRkZWQpO1xuICAgIHRoaXMuX2NsZWFyR3VpZGVzKCk7XG4gIH0sXG5cbiAgX29uWm9vbUVuZDogZnVuY3Rpb24oZSkge1xuICAgIHRoaXMuX3VwZGF0ZUd1aWRlKCk7XG4gIH0sXG5cbiAgX3VwZGF0ZUd1aWRlOiBmdW5jdGlvbihuZXdQb3MpIHtcbiAgICBpZiAodGhpcy5fbm9kZXMubGVuZ3RoKSB7XG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLl9ub2RlcztcbiAgICAgIG5ld1BvcyA9IG5ld1BvcyB8fCB0aGlzLl9tYXAucHJvamVjdCh0aGlzLl9jdXJyZW50TGF0TG5nKTtcblxuICAgICAgdGhpcy5fY2xlYXJHdWlkZXMoKTtcblxuICAgICAgLy8gRHJhdyB0aGUgbmV3IGd1aWRlIGxpbmVcbiAgICAgIHRoaXMuX2RyYXdHdWlkZShcbiAgICAgICAgdGhpcy5fbWFwLnByb2plY3Qobm9kZXNbbm9kZXMubGVuZ3RoIC0gMV0pLFxuICAgICAgICBuZXdQb3NcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIF9kcmF3R3VpZGU6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5mbG9vcihNYXRoLnNxcnQoTWF0aC5wb3coKGIueCAtIGEueCksIDIpICsgTWF0aC5wb3coKGIueSAtIGEueSksIDIpKSk7XG4gICAgdmFyIGRhc2hEaXN0YW5jZSA9IHRoaXMub3B0aW9ucy5kYXNoRGlzdGFuY2U7XG5cbiAgICBpZiAoIXRoaXMuX2d1aWRlc0NvbnRhaW5lcikge1xuICAgICAgdGhpcy5fZ3VpZGVzQ29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21hcGJveGdsLWRyYXctZ3VpZGVzJywgdGhpcy5fbWFwLmdldENvbnRhaW5lcigpKTtcbiAgICB9XG5cbiAgICAvLyBEcmF3IGEgZGFzaCBldmVyeSBHdWlsZGVMaW5lRGlzdGFuY2VcbiAgICB2YXIgZnJhY3Rpb24sIGRhc2hQb2ludCwgZGFzaDtcbiAgICBmb3IgKHZhciBpOyBpIDwgbGVuZ3RoOyBpICs9IGRhc2hEaXN0YW5jZSkge1xuICAgICAgLy8gV29yayBvdXQgYSBmcmFjdGlvbiBhbG9uZyBsaW5lIHdlIGFyZVxuICAgICAgZnJhY3Rpb24gPSBpIC8gbGVuZ3RoO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgYSBuZXcgeCx5IHBvaW50XG4gICAgICBkYXNoUG9pbnQgPSB7XG4gICAgICAgIHg6IE1hdGguZmxvb3IoKGEueCAqICgxIC0gZnJhY3Rpb24pKSArIChmcmFjdGlvbiAqIGIueCkpLFxuICAgICAgICB5OiBNYXRoLmZsb29yKChhLnkgKiAoMSAtIGZyYWN0aW9uKSkgKyAoZnJhY3Rpb24gKiBiLnkpKVxuICAgICAgfTtcblxuICAgICAgLy8gQWRkIGd1aWRlIGRhc2ggdG8gZ3VpZGUgY29udGFpbmVyXG4gICAgICBkYXNoID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21hcGJveGdsLWRyYXctZ3VpZGUtZGFzaCcsIHRoaXMuX2d1aWRlc0NvbnRhaW5lcik7XG5cbiAgICAgIERPTS5zZXRUcmFuc2Zvcm0oZGFzaCwgZGFzaFBvaW50KTtcbiAgICB9XG4gIH0sXG5cbiAgX2NsZWFyR3VpZGVzOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fZ3VpZGVzQ29udGFpbmVyKSB7XG4gICAgICB3aGlsZSAodGhpcy5fZ3VpZGVzQ29udGFpbmVyLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgdGhpcy5fZ3VpZGVzQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2d1aWRlc0NvbnRhaW5lci5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpO1xudmFyIEhhbmRsZXJzID0gcmVxdWlyZSgnLi9oYW5kbGVycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50O1xuXG5mdW5jdGlvbiBQb2ludChtYXApIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgcmVwZWF0TW9kZTogdHJ1ZVxuICB9O1xuXG4gIHRoaXMudHlwZSA9ICdQb2ludCc7XG4gIHRoaXMuaW5pdGlhbGl6ZShtYXAsIG9wdGlvbnMpO1xufVxuXG5Qb2ludC5wcm90b3R5cGUgPSBleHRlbmQoSGFuZGxlcnMsIHtcblxuICBkcmF3U3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgIHRoaXMuX21hcC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uQ2xpY2soZSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbiAgfSxcblxuICBkcmF3U3RvcDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgdGhpcy5fbWFwLm9mZignY2xpY2snLCB0aGlzLl9vbkNsaWNrKTtcbiAgICB9XG4gIH0sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgYyA9IHRoaXMuX21hcC51bnByb2plY3QoW2UucG9pbnQueCwgZS5wb2ludC55XSk7XG4gICAgdmFyIHBvaW50ID0gW2MubG5nLCBjLmxhdF07XG4gICAgdGhpcy5jcmVhdGUodGhpcy50eXBlLCBwb2ludCk7XG4gIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpO1xudmFyIExpbmUgPSByZXF1aXJlKCcuL2xpbmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2x5Z29uO1xuXG5mdW5jdGlvbiBQb2x5Z29uKG1hcCkge1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICByZXBlYXRNb2RlOiB0cnVlXG4gIH07XG5cbiAgdGhpcy50eXBlID0gJ1BvbHlnb24nO1xuICB0aGlzLmluaXRpYWxpemUobWFwLCBvcHRpb25zKTtcbn1cblxuUG9seWdvbi5wcm90b3R5cGUgPSBleHRlbmQoTGluZSwge1xuXG4gIGRyYXdTdGFydDogZnVuY3Rpb24oKSB7fSxcblxuICBkcmF3U3RvcDogZnVuY3Rpb24oKSB7fSxcblxuICBfb25DbGljazogZnVuY3Rpb24oZSkge31cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gU3F1YXJlO1xuXG5mdW5jdGlvbiBTcXVhcmUobWFwKSB7XG4gIGNvbnNvbGUubG9nKG1hcCk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGdldEFsbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gIH0sXG5cbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPIGdldCBhIHNwZWNpZmljIGdlb2pzb24gb2JqZWN0XG4gIH0sXG5cbiAgdW5zZXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE8gdW5kbyBtYW5hZ2VtZW50LlxuICAgIHRoaXMuX2hpc3RvcnkgPSB0aGlzLmdldEFsbCgpLmZlYXR1cmVzO1xuICAgIC8vIFRPRE8gcmVtb3ZlIGEgc3BlY2lmaWMgZ2VvanNvbiBvYmplY3RcbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKHR5cGUsIGNvb3JkaW5hdGVzKSB7XG5cbiAgICB2YXIgb2JqID0ge1xuICAgICAgdHlwZTogJ0ZlYXR1cmUnLFxuICAgICAgcHJvcGVydGllczoge30sXG4gICAgICBnZW9tZXRyeToge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBjb29yZGluYXRlczogY29vcmRpbmF0ZXNcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5fZGF0YS5mZWF0dXJlcy5wdXNoKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICBfZGF0YToge1xuICAgIHR5cGU6ICdGZWF0dXJlQ29sbGVjdGlvbicsXG4gICAgZmVhdHVyZXM6IFtdXG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAge1xuICAgIFwiaWRcIjogXCJnbC1kcmF3LXBvaW50c1wiLFxuICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgIFwic291cmNlXCI6IFwiZHJhd1wiLFxuICAgIFwiZmlsdGVyXCI6IFtcImFsbFwiLCBbXCI9PVwiLCBcIiR0eXBlXCIsIFwiUG9pbnRcIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwiaWNvbi1pbWFnZVwiOiBcIm1hcmtlci0xMlwiLFxuICAgICAgXCJ0ZXh0LWFuY2hvclwiOiBcInRvcFwiLFxuICAgICAgXCJpY29uLWFsbG93LW92ZXJsYXBcIjogdHJ1ZVxuICAgIH0sXG4gICAgXCJwYWludFwiOiB7XG4gICAgICBcImljb24tY29sb3JcIjogXCIjZjFmMDc1XCIsXG4gICAgICBcImljb24tc2l6ZVwiOiAyXG4gICAgfVxuICB9LCB7XG4gICAgXCJpZFwiOiBcImdsLWRyYXctcG9seWdvbnNcIixcbiAgICBcInR5cGVcIjogXCJmaWxsXCIsXG4gICAgXCJzb3VyY2VcIjogXCJkcmF3XCIsXG4gICAgXCJmaWx0ZXJcIjogW1wiYWxsXCIsIFtcIj09XCIsIFwiJHR5cGVcIiwgXCJQb2x5Z29uXCJdXSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwiZmlsbC1jb2xvclwiOiBcIiM1NmI4ODFcIixcbiAgICAgIFwiZmlsbC1vdXRsaW5lLWNvbG9yXCI6IFwiIzU2Yjg4MVwiLFxuICAgICAgXCJmaWxsLW9wYWNpdHlcIjogMC41XG4gICAgfVxuICB9LCB7XG4gICAgXCJpZFwiOiBcImdsLWRyYXctcG9seWdvbi1zdHJva2VcIixcbiAgICBcInR5cGVcIjogXCJsaW5lXCIsXG4gICAgXCJzb3VyY2VcIjogXCJkcmF3XCIsXG4gICAgXCJmaWx0ZXJcIjogW1wiYWxsXCIsIFtcIj09XCIsIFwiJHR5cGVcIiwgXCJQb2x5Z29uXCJdXSxcbiAgICBcImxheW91dFwiOiB7XG4gICAgICBcImxpbmUtY2FwXCI6IFwicm91bmRcIixcbiAgICAgIFwibGluZS1qb2luXCI6IFwicm91bmRcIlxuICAgIH0sXG4gICAgXCJwYWludFwiOiB7XG4gICAgICBcImxpbmUtY29sb3JcIjogXCIjNTZiODgxXCIsXG4gICAgICBcImxpbmUtd2lkdGhcIjogMlxuICAgIH1cbiAgfSwge1xuICAgIFwiaWRcIjogXCJnbC1kcmF3LWxpbmVcIixcbiAgICBcInR5cGVcIjogXCJsaW5lXCIsXG4gICAgXCJzb3VyY2VcIjogXCJkcmF3XCIsXG4gICAgXCJmaWx0ZXJcIjogW1wiYWxsXCIsIFtcIj09XCIsIFwiJHR5cGVcIiwgXCJMaW5lU3RyaW5nXCJdXSxcbiAgICBcImxheW91dFwiOiB7XG4gICAgICBcImxpbmUtY2FwXCI6IFwicm91bmRcIixcbiAgICAgIFwibGluZS1qb2luXCI6IFwicm91bmRcIlxuICAgIH0sXG4gICAgXCJwYWludFwiOiB7XG4gICAgICBcImxpbmUtY29sb3JcIjogXCIjOGE4YWNiXCIsXG4gICAgICBcImxpbmUtd2lkdGhcIjogNFxuICAgIH1cbiAgfVxuXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogTWVyZ2UgdXNlciBwcm92aWRlZCBvcHRpb25zIG9iamVjdCB3aXRoIGEgZGVmYXVsdCBvbmVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIENvbnRhaW5pbmcgYW4gb3B0aW9ucyBrZXkgd2l0aCB3aGljaCB0byBtZXJnZVxuICogQHBhcmFtIHtvcHRpb25zfSBvcHRpb25zIFByb3ZpZGVkIG9wdGlvbnMgd2l0aCB3aGljaCB0byBtZXJnZVxuICogQHJldHVybnMge09iamVjdH1cbiAqL1xubW9kdWxlLmV4cG9ydHMuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucykge1xuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KCdvcHRpb25zJykpIHtcbiAgICAgICAgb2JqLm9wdGlvbnMgPSBvYmoub3B0aW9ucyA/IE9iamVjdC5jcmVhdGUob2JqLm9wdGlvbnMpIDoge307XG4gICAgfVxuICAgIGZvciAodmFyIGkgaW4gb3B0aW9ucykge1xuICAgICAgICBvYmoub3B0aW9uc1tpXSA9IG9wdGlvbnNbaV07XG4gICAgfVxuICAgIHJldHVybiBvYmoub3B0aW9ucztcbn07XG5cbm1vZHVsZS5leHBvcnRzLkRPTSA9IHt9O1xuXG4vKiBCdWlsZHMgRE9NIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHRhZyBFbGVtZW50IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBbY2xhc3NOYW1lXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb250YWluZXJdIERPTSBlbGVtZW50IHRvIGFwcGVuZCB0b1xuICogQHBhcmFtIHtPYmplY3R9IFthdHRyYnV0ZXNdIE9iamVjdCBjb250YWluaW5nIGF0dHJpYnV0ZXMgdG8gYXBwbHkgdG8gYW5cbiAqIGVsZW1lbnQuIEF0dHJpYnV0ZSBuYW1lIGNvcnJlc3BvbmRzIHRvIHRoZSBrZXkuXG4gKiBAcmV0dXJucyB7ZWx9IFRoZSBkb20gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cy5ET00uY3JlYXRlID0gZnVuY3Rpb24odGFnLCBjbGFzc05hbWUsIGNvbnRhaW5lciwgYXR0cmlidXRlcykge1xuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG4gIH1cbiAgaWYgKGNvbnRhaW5lcikgY29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcbiAgcmV0dXJuIGVsO1xufTtcblxuLyogUmVtb3ZlcyBjbGFzc2VzIGZyb20gYW4gYXJyYXkgb2YgRE9NIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudHNcbiAqIEBwYXJhbSB7U3RyaW5nfSBrbGFzc1xuICovXG5tb2R1bGUuZXhwb3J0cy5ET00ucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbGVtZW50cywga2xhc3MpIHtcbiAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGtsYXNzKTtcbiAgfSk7XG59O1xuXG52YXIgZG9jU3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGU7XG5cbmZ1bmN0aW9uIHRlc3RQcm9wKHByb3BzKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAocHJvcHNbaV0gaW4gZG9jU3R5bGUpIHtcbiAgICAgIHJldHVybiBwcm9wc1tpXTtcbiAgICB9XG4gIH1cbn1cblxudmFyIHNlbGVjdFByb3AgPSB0ZXN0UHJvcChbXG4gICd1c2VyU2VsZWN0JyxcbiAgJ01velVzZXJTZWxlY3QnLFxuICAnV2Via2l0VXNlclNlbGVjdCcsXG4gICdtc1VzZXJTZWxlY3QnXG5dKTtcblxudmFyIHRyYW5zZm9ybVByb3AgPSB0ZXN0UHJvcChbXG4gICd0cmFuc2Zvcm0nLFxuICAnV2Via2l0VHJhbnNmb3JtJ1xuXSk7XG5cbm1vZHVsZS5leHBvcnRzLnNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uKGVsLCB2YWx1ZSkge1xuICBlbC5zdHlsZVt0cmFuc2Zvcm1Qcm9wXSA9IHZhbHVlO1xufTtcblxudmFyIHVzZXJTZWxlY3Q7XG5tb2R1bGUuZXhwb3J0cy5ET00uZGlzYWJsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoc2VsZWN0UHJvcCkge1xuICAgIHVzZXJTZWxlY3QgPSBkb2NTdHlsZVtzZWxlY3RQcm9wXTtcbiAgICBkb2NTdHlsZVtzZWxlY3RQcm9wXSA9ICdub25lJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMuRE9NLmVuYWJsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoc2VsZWN0UHJvcCkge1xuICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gdXNlclNlbGVjdDtcbiAgfVxufTtcbiJdfQ==
