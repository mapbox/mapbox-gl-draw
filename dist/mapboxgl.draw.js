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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kcmF3LmpzIiwic3JjL2hhbmRsZXJzL2NpcmNsZS5qcyIsInNyYy9oYW5kbGVycy9oYW5kbGVycy5qcyIsInNyYy9oYW5kbGVycy9saW5lLmpzIiwic3JjL2hhbmRsZXJzL3BvaW50LmpzIiwic3JjL2hhbmRsZXJzL3BvbHlnb24uanMiLCJzcmMvaGFuZGxlcnMvc3F1YXJlLmpzIiwic3JjL3N0b3JlLmpzIiwic3JjL3RoZW1lLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJgdXNlIHN0cmljdGA7XG5cbi8qKiBBIGRyYXdpbmcgY29tcG9uZW50IGZvciBtYXBib3hnbFxuICogQGNsYXNzIG1hcGJveC5EcmF3XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5wb3NpdGlvbj10b3AtcmlnaHRdIEEgc3RyaW5nIGluZGljYXRpbmcgdGhlIGNvbnRyb2wncyBwb3NpdGlvbiBvbiB0aGUgbWFwLiBPcHRpb25zIGFyZSBgdG9wcmlnaHRgLCBgdG9wbGVmdGAsIGBib3R0b21yaWdodGAsIGBib3R0b21sZWZ0YFxuICogQHJldHVybnMge0RyYXd9IGB0aGlzYFxuICogQGV4YW1wbGVcbiAqIHZhciBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAqICAgY29udGFpbmVyOiAnbWFwJyxcbiAqICAgc3R5bGU6ICdodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1zdHlsZXMvc3R5bGVzL291dGRvb3JzLXY3Lmpzb24nXG4gKiB9KTtcbiAqXG4gKiAvLyBJbml0aWFsaXplIHRoZSBkcmF3aW5nIGNvbXBvbmVudFxuICogbWFwLmFkZENvbnRyb2wobmV3IG1hcGJveGdsLkRyYXcoKSk7XG4gKi9cbm1hcGJveGdsLkRyYXcgPSByZXF1aXJlKCcuL3NyYy9kcmF3LmpzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgdmFyIHRhcmdldCA9IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBhZGRUbzogZnVuY3Rpb24obWFwKSB7XG4gICAgdGhpcy5fbWFwID0gbWFwO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSB0aGlzLm9uQWRkKG1hcCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgIHZhciBwb3MgPSB0aGlzLm9wdGlvbnMucG9zaXRpb247XG4gICAgICB2YXIgY29ybmVyID0gbWFwLl9jb250cm9sQ29ybmVyc1twb3NdO1xuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSArPSAnIG1hcGJveGdsLWN0cmwtZHJhdyBtYXBib3hnbC1jdHJsJztcblxuICAgICAgaWYgKHBvcy5pbmRleE9mKCdib3R0b20nKSAhPT0gLTEpIHtcbiAgICAgICAgY29ybmVyLmluc2VydEJlZm9yZShjb250YWluZXIsIGNvcm5lci5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvcm5lci5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICBpZiAodGhpcy5vblJlbW92ZSkgdGhpcy5vblJlbW92ZSh0aGlzLl9tYXApO1xuICAgIHRoaXMuX21hcCA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGdsb2JhbCBtYXBib3hnbCAqL1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG52YXIgdGhlbWUgPSByZXF1aXJlKCcuL3RoZW1lJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIERPTSA9IHV0aWwuRE9NO1xuXG4vLyBDb250cm9sIGhhbmRsZXJzXG52YXIgUG9seWdvbiA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvcG9seWdvbicpO1xudmFyIExpbmUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL2xpbmUnKTtcbnZhciBDaXJjbGUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL2NpcmNsZScpO1xudmFyIFNxdWFyZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvc3F1YXJlJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2hhbmRsZXJzL3BvaW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhdztcblxuZnVuY3Rpb24gRHJhdyhvcHRpb25zKSB7XG4gIHV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbn1cblxuRHJhdy5wcm90b3R5cGUgPSBleHRlbmQoQ29udHJvbCwge1xuICBvcHRpb25zOiB7XG4gICAgcG9zaXRpb246ICd0b3AtbGVmdCcsXG4gICAgY29udHJvbHM6IHtcbiAgICAgIG1hcmtlcjogdHJ1ZSxcbiAgICAgIGxpbmU6IHRydWUsXG4gICAgICBzaGFwZTogdHJ1ZSxcbiAgICAgIHNxdWFyZTogdHJ1ZSxcbiAgICAgIGNpcmNsZTogdHJ1ZVxuICAgIH1cbiAgfSxcblxuICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGNvbnRyb2xDbGFzcyA9IHRoaXMuX2NvbnRyb2xDbGFzcyA9ICdtYXBib3hnbC1jdHJsLWRyYXctYnRuJztcbiAgICB2YXIgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21hcGJveGdsLWN0cmwtZ3JvdXAnLCBtYXAuZ2V0Q29udGFpbmVyKCkpO1xuICAgIHZhciBjb250cm9scyA9IHRoaXMub3B0aW9ucy5jb250cm9scztcblxuICAgIGlmIChjb250cm9scy5zaGFwZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgc2hhcGUnLCAnU2hhcGUgdG9vbCcsIHRoaXMuX2RyYXdQb2x5Z29uLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLmxpbmUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIGxpbmUnLCAnTGluZSB0b29sJywgdGhpcy5fZHJhd0xpbmUuYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMuY2lyY2xlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBjaXJjbGUnLCAnQ2lyY2xlIHRvb2wnLCB0aGlzLl9kcmF3Q2lyY2xlLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLnNxdWFyZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgc3F1YXJlJywgJ1JlY3RhbmdsZSB0b29sJywgdGhpcy5fZHJhd1NxdWFyZS5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5tYXJrZXIpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIG1hcmtlcicsICdNYXJrZXIgdG9vbCcsIHRoaXMuX2RyYXdQb2ludC5iaW5kKG1hcCkpO1xuXG4gICAgdGhpcy5fbWFwU3RhdGUobWFwKTtcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9LFxuXG4gIF9kcmF3UG9seWdvbjogZnVuY3Rpb24oKSB7XG4gICAgbmV3IFBvbHlnb24odGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdMaW5lOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgTGluZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd0NpcmNsZTogZnVuY3Rpb24oKSB7XG4gICAgbmV3IENpcmNsZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd1NxdWFyZTogZnVuY3Rpb24oKSB7XG4gICAgbmV3IFNxdWFyZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd1BvaW50OiBmdW5jdGlvbigpIHtcbiAgICBuZXcgUG9pbnQodGhpcyk7XG4gIH0sXG5cbiAgX2NyZWF0ZUJ1dHRvbjogZnVuY3Rpb24oY2xhc3NOYW1lLCB0aXRsZSwgZm4pIHtcbiAgICB2YXIgYSA9IERPTS5jcmVhdGUoJ2J1dHRvbicsIGNsYXNzTmFtZSwgdGhpcy5fY29udGFpbmVyLCB7XG4gICAgICB0aXRsZTogdGl0bGVcbiAgICB9KTtcblxuICAgIHZhciBjb250cm9sQ2xhc3MgPSB0aGlzLl9jb250cm9sQ2xhc3M7XG4gICAgdmFyIG1hcCA9IHRoaXMuX21hcDtcblxuICAgIGEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIC8vIENhbmNlbCBhbnkgaW5pdGlhbGl6ZWQgaGFuZGxlcnNcbiAgICAgIG1hcC5maXJlKCdkcmF3LmNhbmNlbCcpO1xuXG4gICAgICBpZiAodGhpcy5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBET00ucmVtb3ZlQ2xhc3MoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb250cm9sQ2xhc3MpLCAnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIGZuKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYTtcbiAgfSxcblxuICBfbWFwU3RhdGU6IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBkcmF3TGF5ZXI7XG4gICAgdmFyIGNvbnRyb2xDbGFzcyA9IHRoaXMuX2NvbnRyb2xDbGFzcztcblxuICAgIG1hcC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICBtYXAub24oJ2RyYXcuc3RvcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgRE9NLnJlbW92ZUNsYXNzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29udHJvbENsYXNzKSwgJ2FjdGl2ZScpO1xuICAgICAgfSk7XG5cbiAgICAgIG1hcC5vbignZHJhdy5mZWF0dXJlLmNyZWF0ZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkcmF3TGF5ZXIpIHtcbiAgICAgICAgICBkcmF3TGF5ZXIuc2V0RGF0YShlLmdlb2pzb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRyYXdMYXllciA9IG5ldyBtYXBib3hnbC5HZW9KU09OU291cmNlKHtcbiAgICAgICAgICAgIGRhdGE6IGUuZ2VvanNvblxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgbWFwLmFkZFNvdXJjZSgnZHJhdycsIGRyYXdMYXllcik7XG5cbiAgICAgICAgICB0aGVtZS5mb3JFYWNoKGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIoc3R5bGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBDaXJjbGU7XG5cbmZ1bmN0aW9uIENpcmNsZShtYXApIHtcbiAgY29uc29sZS5sb2cobWFwKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBpbml0aWFsaXplOiBmdW5jdGlvbihtYXAsIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdGhpcy5fY29udGFpbmVyID0gbWFwLmdldENvbnRhaW5lcigpO1xuICAgIHV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmVuYWJsZSgpO1xuICB9LFxuXG4gIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hcCA9IHRoaXMuX21hcDtcbiAgICBpZiAobWFwKSB7XG4gICAgICB1dGlsLkRPTS5kaXNhYmxlU2VsZWN0aW9uKCk7XG4gICAgICBtYXAuZ2V0Q29udGFpbmVyKCkuZm9jdXMoKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2NhbmNlbERyYXdpbmcuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9jb250YWluZXIuY2xhc3NMaXN0LmFkZCgnbWFwYm94Z2wtZHJhdy1hY3RpdmF0ZWQnKTtcbiAgICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LnN0YXJ0JywgeyBmZWF0dXJlVHlwZTogdGhpcy50eXBlIH0pO1xuICAgICAgdGhpcy5kcmF3U3RhcnQoKTtcblxuICAgICAgdGhpcy5fbWFwLm9uKCdkcmF3LmNhbmNlbCcsIHRoaXMuZGlzYWJsZS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH0sXG5cbiAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgdXRpbC5ET00uZW5hYmxlU2VsZWN0aW9uKCk7XG4gICAgICB0aGlzLl9jb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9jYW5jZWxEcmF3aW5nLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ21hcGJveGdsLWRyYXctYWN0aXZhdGVkJyk7XG4gICAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5zdG9wJywgeyBmZWF0dXJlVHlwZTogdGhpcy50eXBlIH0pO1xuICAgICAgdGhpcy5kcmF3U3RvcCgpO1xuICAgIH1cbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uKHR5cGUsIGNvb3JkaW5hdGVzKSB7XG4gICAgdmFyIGZlYXR1cmUgPSBzdG9yZS5zZXQodHlwZSwgY29vcmRpbmF0ZXMpO1xuICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LmZlYXR1cmUuY3JlYXRlZCcsIHtnZW9qc29uOiBzdG9yZS5nZXRBbGwoKX0pO1xuICAgIHRoaXMuX2NyZWF0ZWQoZmVhdHVyZSk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucmVwZWF0TW9kZSkgdGhpcy5kaXNhYmxlKCk7XG4gIH0sXG5cbiAgX2NyZWF0ZWQ6IGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5jcmVhdGVkJywge1xuICAgICAgZmVhdHVyZVR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZlYXR1cmU6IGZlYXR1cmVcbiAgICB9KTtcbiAgfSxcblxuICBfY2FuY2VsRHJhd2luZzogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDI3KSB7IC8vIGVzY1xuICAgICAgdGhpcy5fbWFwLmZpcmUoJ2RyYXcuY2FuY2VsJyk7XG4gICAgfVxuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBnbG9iYWwgbWFwYm94Z2wgKi9cblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJyk7XG52YXIgSGFuZGxlcnMgPSByZXF1aXJlKCcuL2hhbmRsZXJzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBET00gPSB1dGlsLkRPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaW5lO1xuXG5mdW5jdGlvbiBMaW5lKG1hcCkge1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICBkYXNoRGlzdGFuY2U6IDIwLFxuICAgIHJlcGVhdE1vZGU6IHRydWUsXG4gIH07XG5cbiAgdGhpcy50eXBlID0gJ0xpbmVTdHJpbmcnO1xuICB0aGlzLmluaXRpYWxpemUobWFwLCBvcHRpb25zKTtcbn1cblxuTGluZS5wcm90b3R5cGUgPSBleHRlbmQoSGFuZGxlcnMsIHtcblxuICBkcmF3U3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9tYXApIHtcblxuICAgICAgLy8gQ29udGFpbmVyIHRvIGhvbGQgb24gdG8gYW5cbiAgICAgIC8vIEFycmF5IHBvaW50cyBvZiBjb29yZGluYXRlc1xuICAgICAgdGhpcy5fbm9kZXMgPSBbXTtcbiAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9tYXAuZ2V0Q29udGFpbmVyKCk7XG5cbiAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uTW91c2VEb3duKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5fb25Nb3VzZU1vdmUoZSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5fb25Nb3VzZVVwKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgdGhpcy5fbWFwLm9uKCd6b29tZW5kJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vblpvb21FbmQoZSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbiAgfSxcblxuICBkcmF3U3RvcDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgdGhpcy5fbWFwLm9mZignY2xpY2snLCB0aGlzLl9vbkNsaWNrKTtcbiAgICB9XG4gIH0sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyB2YXIgYyA9IHRoaXMuX21hcC51bnByb2plY3QoW2UucG9pbnQueCwgZS5wb2ludC55XSk7XG4gICAgLy8gdmFyIHBvaW50ID0gW2MubG5nLCBjLmxhdF07XG4gICAgLy8gdGhpcy5jcmVhdGUodGhpcy50eXBlLCBwb2ludCk7XG4gIH0sXG5cbiAgX29uTW91c2VEb3duOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHBvaW50ID0gdGhpcy5fbW91c2VQb3MoZSk7XG4gICAgdGhpcy5fY3VycmVudExhdExuZyA9IHRoaXMuX21hcC51bnByb2plY3QoW3BvaW50LngsIHBvaW50LnldKTtcbiAgfSxcblxuICBfb25Nb3VzZU1vdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudExhdExuZykge1xuICAgICAgdmFyIHBvaW50ID0gdGhpcy5fbW91c2VQb3MoZSk7XG4gICAgICB2YXIgbmV3UG9zID0gdGhpcy5fbWFwLnVucHJvamVjdChbcG9pbnQueCwgcG9pbnQueV0pO1xuICAgICAgdGhpcy5fdXBkYXRlR3VpZGUobmV3UG9zKTtcbiAgICB9XG4gIH0sXG5cbiAgX29uTW91c2VVcDogZnVuY3Rpb24oZSkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50TGF0TG5nKSB7XG4gICAgICB2YXIgcG9pbnQgPSB0aGlzLl9tb3VzZVBvcyhlKTtcbiAgICAgIHRoaXMuX2FkZFZlcnRleCh0aGlzLl9tYXAudW5wcm9qZWN0KFtwb2ludC54LCBwb2ludC55XSkpO1xuICAgIH1cblxuICAgIHRoaXMuX2N1cnJlbnRMYXRMbmcgPSBudWxsO1xuICB9LFxuXG4gIF9tb3VzZVBvczogZnVuY3Rpb24oZSkge1xuICAgIHZhciBlbCA9IHRoaXMuX21hcC5nZXRDb250YWluZXIoKTtcbiAgICB2YXIgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiBuZXcgbWFwYm94Z2wuUG9pbnQoXG4gICAgICBlLmNsaWVudFggLSByZWN0LmxlZnQgLSBlbC5jbGllbnRMZWZ0LFxuICAgICAgZS5jbGllbnRZIC0gcmVjdC50b3AgLSBlbC5jbGllbnRUb3BcbiAgICApO1xuICB9LFxuXG4gIF9jcmVhdGVIYW5kbGVzOiBmdW5jdGlvbihsYXRMbmcpIHtcbiAgICAvLyAxLiBUT0RPIFRha2UgdGhlIGN1cnJlbnQgY29vcmRpbmF0ZXMuXG4gICAgLy8gMi4gdW5wcm9qZWN0IGFuZCBwbG90IGEgZGl2IG9uIHRoZSBtYXBcbiAgICAvLyB0byBhY3QgYXMgYSBpbnRlcmFjdGl2ZSBjb250cm9sIHRoYXQgbGlzdGVuc1xuICAgIC8vIHRvIGEgY2xpY2sgZXZlbnQgdG8gY29tcGxldGUgYSBwYXRoLlxuICAgIC8vIFRoZSBjbGljayBldmVudCBzaG91bGQgcmVzcG9uZCB0byB0aGlzLl9maW5pc2hTaGFwZSgpO1xuICB9LFxuXG4gIF9hZGRWZXJ0ZXg6IGZ1bmN0aW9uKGxhdExuZykge1xuICAgIHRoaXMuX25vZGVzLnB1c2gobGF0TG5nKTtcbiAgICB0aGlzLl9jcmVhdGVIYW5kbGVzKCk7XG4gICAgdGhpcy5fdmVydGV4Q2hhbmdlZChsYXRMbmcsIHRydWUpO1xuICB9LFxuXG4gIF92ZXJ0ZXhDaGFuZ2VkOiBmdW5jdGlvbihsYXRMbmcsIGFkZGVkKSB7XG4gICAgLy8gdGhpcy5fdXBkYXRlUnVubmluZ01lYXN1cmUobGF0bG5nLCBhZGRlZCk7XG4gICAgdGhpcy5fY2xlYXJHdWlkZXMoKTtcbiAgfSxcblxuICBfb25ab29tRW5kOiBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5fdXBkYXRlR3VpZGUoKTtcbiAgfSxcblxuICBfdXBkYXRlR3VpZGU6IGZ1bmN0aW9uKG5ld1Bvcykge1xuICAgIGlmICh0aGlzLl9ub2Rlcy5sZW5ndGgpIHtcbiAgICAgIHZhciBub2RlcyA9IHRoaXMuX25vZGVzO1xuICAgICAgbmV3UG9zID0gbmV3UG9zIHx8IHRoaXMuX21hcC5wcm9qZWN0KHRoaXMuX2N1cnJlbnRMYXRMbmcpO1xuXG4gICAgICB0aGlzLl9jbGVhckd1aWRlcygpO1xuXG4gICAgICAvLyBEcmF3IHRoZSBuZXcgZ3VpZGUgbGluZVxuICAgICAgdGhpcy5fZHJhd0d1aWRlKFxuICAgICAgICB0aGlzLl9tYXAucHJvamVjdChub2Rlc1tub2Rlcy5sZW5ndGggLSAxXSksXG4gICAgICAgIG5ld1Bvc1xuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgX2RyYXdHdWlkZTogZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciBsZW5ndGggPSBNYXRoLmZsb29yKE1hdGguc3FydChNYXRoLnBvdygoYi54IC0gYS54KSwgMikgKyBNYXRoLnBvdygoYi55IC0gYS55KSwgMikpKTtcbiAgICB2YXIgZGFzaERpc3RhbmNlID0gdGhpcy5vcHRpb25zLmRhc2hEaXN0YW5jZTtcblxuICAgIGlmICghdGhpcy5fZ3VpZGVzQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9ndWlkZXNDb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwYm94Z2wtZHJhdy1ndWlkZXMnLCB0aGlzLl9tYXAuZ2V0Q29udGFpbmVyKCkpO1xuICAgIH1cblxuICAgIC8vIERyYXcgYSBkYXNoIGV2ZXJ5IEd1aWxkZUxpbmVEaXN0YW5jZVxuICAgIHZhciBmcmFjdGlvbiwgZGFzaFBvaW50LCBkYXNoO1xuICAgIGZvciAodmFyIGk7IGkgPCBsZW5ndGg7IGkgKz0gZGFzaERpc3RhbmNlKSB7XG4gICAgICAvLyBXb3JrIG91dCBhIGZyYWN0aW9uIGFsb25nIGxpbmUgd2UgYXJlXG4gICAgICBmcmFjdGlvbiA9IGkgLyBsZW5ndGg7XG5cbiAgICAgIC8vIENhbGN1bGF0ZSBhIG5ldyB4LHkgcG9pbnRcbiAgICAgIGRhc2hQb2ludCA9IHtcbiAgICAgICAgeDogTWF0aC5mbG9vcigoYS54ICogKDEgLSBmcmFjdGlvbikpICsgKGZyYWN0aW9uICogYi54KSksXG4gICAgICAgIHk6IE1hdGguZmxvb3IoKGEueSAqICgxIC0gZnJhY3Rpb24pKSArIChmcmFjdGlvbiAqIGIueSkpXG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgZ3VpZGUgZGFzaCB0byBndWlkZSBjb250YWluZXJcbiAgICAgIGRhc2ggPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwYm94Z2wtZHJhdy1ndWlkZS1kYXNoJywgdGhpcy5fZ3VpZGVzQ29udGFpbmVyKTtcblxuICAgICAgRE9NLnNldFRyYW5zZm9ybShkYXNoLCBkYXNoUG9pbnQpO1xuICAgIH1cbiAgfSxcblxuICBfY2xlYXJHdWlkZXM6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9ndWlkZXNDb250YWluZXIpIHtcbiAgICAgIHdoaWxlICh0aGlzLl9ndWlkZXNDb250YWluZXIuZmlyc3RDaGlsZCkge1xuICAgICAgICB0aGlzLl9ndWlkZXNDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fZ3VpZGVzQ29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJyk7XG52YXIgSGFuZGxlcnMgPSByZXF1aXJlKCcuL2hhbmRsZXJzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnQ7XG5cbmZ1bmN0aW9uIFBvaW50KG1hcCkge1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICByZXBlYXRNb2RlOiB0cnVlXG4gIH07XG5cbiAgdGhpcy50eXBlID0gJ1BvaW50JztcbiAgdGhpcy5pbml0aWFsaXplKG1hcCwgb3B0aW9ucyk7XG59XG5cblBvaW50LnByb3RvdHlwZSA9IGV4dGVuZChIYW5kbGVycywge1xuXG4gIGRyYXdTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgdGhpcy5fbWFwLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5fb25DbGljayhlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuICB9LFxuXG4gIGRyYXdTdG9wOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl9tYXAub2ZmKCdjbGljaycsIHRoaXMuX29uQ2xpY2spO1xuICAgIH1cbiAgfSxcblxuICBfb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgIHZhciBjID0gdGhpcy5fbWFwLnVucHJvamVjdChbZS5wb2ludC54LCBlLnBvaW50LnldKTtcbiAgICB2YXIgcG9pbnQgPSBbYy5sbmcsIGMubGF0XTtcbiAgICB0aGlzLmNyZWF0ZSh0aGlzLnR5cGUsIHBvaW50KTtcbiAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJyk7XG52YXIgTGluZSA9IHJlcXVpcmUoJy4vbGluZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlnb247XG5cbmZ1bmN0aW9uIFBvbHlnb24obWFwKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIHJlcGVhdE1vZGU6IHRydWVcbiAgfTtcblxuICB0aGlzLnR5cGUgPSAnUG9seWdvbic7XG4gIHRoaXMuaW5pdGlhbGl6ZShtYXAsIG9wdGlvbnMpO1xufVxuXG5Qb2x5Z29uLnByb3RvdHlwZSA9IGV4dGVuZChMaW5lLCB7XG5cbiAgZHJhd1N0YXJ0OiBmdW5jdGlvbigpIHt9LFxuXG4gIGRyYXdTdG9wOiBmdW5jdGlvbigpIHt9LFxuXG4gIF9vbkNsaWNrOiBmdW5jdGlvbihlKSB7fVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBTcXVhcmU7XG5cbmZ1bmN0aW9uIFNxdWFyZShtYXApIHtcbiAgY29uc29sZS5sb2cobWFwKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgZ2V0QWxsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgfSxcblxuICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE8gZ2V0IGEgc3BlY2lmaWMgZ2VvanNvbiBvYmplY3RcbiAgfSxcblxuICB1bnNldDogZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETyB1bmRvIG1hbmFnZW1lbnQuXG4gICAgdGhpcy5faGlzdG9yeSA9IHRoaXMuZ2V0QWxsKCkuZmVhdHVyZXM7XG4gICAgLy8gVE9ETyByZW1vdmUgYSBzcGVjaWZpYyBnZW9qc29uIG9iamVjdFxuICB9LFxuXG4gIHNldDogZnVuY3Rpb24odHlwZSwgY29vcmRpbmF0ZXMpIHtcblxuICAgIHZhciBvYmogPSB7XG4gICAgICB0eXBlOiAnRmVhdHVyZScsXG4gICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgIGdlb21ldHJ5OiB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGNvb3JkaW5hdGVzOiBjb29yZGluYXRlc1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9kYXRhLmZlYXR1cmVzLnB1c2gob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIF9kYXRhOiB7XG4gICAgdHlwZTogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcbiAgICBmZWF0dXJlczogW11cbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICB7XG4gICAgXCJpZFwiOiBcImdsLWRyYXctcG9pbnRzXCIsXG4gICAgXCJ0eXBlXCI6IFwic3ltYm9sXCIsXG4gICAgXCJzb3VyY2VcIjogXCJkcmF3XCIsXG4gICAgXCJmaWx0ZXJcIjogW1wiYWxsXCIsIFtcIj09XCIsIFwiJHR5cGVcIiwgXCJQb2ludFwiXV0sXG4gICAgXCJsYXlvdXRcIjoge1xuICAgICAgXCJpY29uLWltYWdlXCI6IFwibWFya2VyLTEyXCIsXG4gICAgICBcInRleHQtYW5jaG9yXCI6IFwidG9wXCIsXG4gICAgICBcImljb24tYWxsb3ctb3ZlcmxhcFwiOiB0cnVlXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwiaWNvbi1jb2xvclwiOiBcIiNmMWYwNzVcIixcbiAgICAgIFwiaWNvbi1zaXplXCI6IDJcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2x5Z29uc1wiLFxuICAgIFwidHlwZVwiOiBcImZpbGxcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvbHlnb25cIl1dLFxuICAgIFwicGFpbnRcIjoge1xuICAgICAgXCJmaWxsLWNvbG9yXCI6IFwiIzU2Yjg4MVwiLFxuICAgICAgXCJmaWxsLW91dGxpbmUtY29sb3JcIjogXCIjNTZiODgxXCIsXG4gICAgICBcImZpbGwtb3BhY2l0eVwiOiAwLjVcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2x5Z29uLXN0cm9rZVwiLFxuICAgIFwidHlwZVwiOiBcImxpbmVcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvbHlnb25cIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwibGluZS1jYXBcIjogXCJyb3VuZFwiLFxuICAgICAgXCJsaW5lLWpvaW5cIjogXCJyb3VuZFwiXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwibGluZS1jb2xvclwiOiBcIiM1NmI4ODFcIixcbiAgICAgIFwibGluZS13aWR0aFwiOiAyXG4gICAgfVxuICB9LCB7XG4gICAgXCJpZFwiOiBcImdsLWRyYXctbGluZVwiLFxuICAgIFwidHlwZVwiOiBcImxpbmVcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIkxpbmVTdHJpbmdcIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwibGluZS1jYXBcIjogXCJyb3VuZFwiLFxuICAgICAgXCJsaW5lLWpvaW5cIjogXCJyb3VuZFwiXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwibGluZS1jb2xvclwiOiBcIiM4YThhY2JcIixcbiAgICAgIFwibGluZS13aWR0aFwiOiA0XG4gICAgfVxuICB9XG5dO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBNZXJnZSB1c2VyIHByb3ZpZGVkIG9wdGlvbnMgb2JqZWN0IHdpdGggYSBkZWZhdWx0IG9uZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogQ29udGFpbmluZyBhbiBvcHRpb25zIGtleSB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gKiBAcGFyYW0ge29wdGlvbnN9IG9wdGlvbnMgUHJvdmlkZWQgb3B0aW9ucyB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5tb2R1bGUuZXhwb3J0cy5zZXRPcHRpb25zID0gZnVuY3Rpb24ob2JqLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJ29wdGlvbnMnKSkge1xuICAgICAgICBvYmoub3B0aW9ucyA9IG9iai5vcHRpb25zID8gT2JqZWN0LmNyZWF0ZShvYmoub3B0aW9ucykgOiB7fTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG4gICAgICAgIG9iai5vcHRpb25zW2ldID0gb3B0aW9uc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIG9iai5vcHRpb25zO1xufTtcblxubW9kdWxlLmV4cG9ydHMuRE9NID0ge307XG5cbi8qIEJ1aWxkcyBET00gZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFnIEVsZW1lbnQgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IFtjbGFzc05hbWVdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbnRhaW5lcl0gRE9NIGVsZW1lbnQgdG8gYXBwZW5kIHRvXG4gKiBAcGFyYW0ge09iamVjdH0gW2F0dHJidXRlc10gT2JqZWN0IGNvbnRhaW5pbmcgYXR0cmlidXRlcyB0byBhcHBseSB0byBhblxuICogZWxlbWVudC4gQXR0cmlidXRlIG5hbWUgY29ycmVzcG9uZHMgdG8gdGhlIGtleS5cbiAqIEByZXR1cm5zIHtlbH0gVGhlIGRvbSBlbGVtZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzLkRPTS5jcmVhdGUgPSBmdW5jdGlvbih0YWcsIGNsYXNzTmFtZSwgY29udGFpbmVyLCBhdHRyaWJ1dGVzKSB7XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAoYXR0cmlidXRlcykge1xuICAgIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbiAgfVxuICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuICByZXR1cm4gZWw7XG59O1xuXG4vKiBSZW1vdmVzIGNsYXNzZXMgZnJvbSBhbiBhcnJheSBvZiBET00gZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50c1xuICogQHBhcmFtIHtTdHJpbmd9IGtsYXNzXG4gKi9cbm1vZHVsZS5leHBvcnRzLkRPTS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1lbnRzLCBrbGFzcykge1xuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbihlbCkge1xuICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoa2xhc3MpO1xuICB9KTtcbn07XG5cbnZhciBkb2NTdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxuZnVuY3Rpb24gdGVzdFByb3AocHJvcHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChwcm9wc1tpXSBpbiBkb2NTdHlsZSkge1xuICAgICAgcmV0dXJuIHByb3BzW2ldO1xuICAgIH1cbiAgfVxufVxuXG52YXIgc2VsZWN0UHJvcCA9IHRlc3RQcm9wKFtcbiAgJ3VzZXJTZWxlY3QnLFxuICAnTW96VXNlclNlbGVjdCcsXG4gICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgJ21zVXNlclNlbGVjdCdcbl0pO1xuXG52YXIgdHJhbnNmb3JtUHJvcCA9IHRlc3RQcm9wKFtcbiAgJ3RyYW5zZm9ybScsXG4gICdXZWJraXRUcmFuc2Zvcm0nXG5dKTtcblxubW9kdWxlLmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24oZWwsIHZhbHVlKSB7XG4gIGVsLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdmFsdWU7XG59O1xuXG52YXIgdXNlclNlbGVjdDtcbm1vZHVsZS5leHBvcnRzLkRPTS5kaXNhYmxlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgdXNlclNlbGVjdCA9IGRvY1N0eWxlW3NlbGVjdFByb3BdO1xuICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gJ25vbmUnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5ET00uZW5hYmxlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgZG9jU3R5bGVbc2VsZWN0UHJvcF0gPSB1c2VyU2VsZWN0O1xuICB9XG59O1xuIl19
