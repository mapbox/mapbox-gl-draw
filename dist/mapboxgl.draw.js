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

    a.addEventListener('click', function(e) {
      e.preventDefault();

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

    map.on('load', function() {
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
      "icon-image": "dot.sdf",
      "icon-ignore-placement": true,
      "icon-max-size": 1,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kcmF3LmpzIiwic3JjL2hhbmRsZXJzL2NpcmNsZS5qcyIsInNyYy9oYW5kbGVycy9oYW5kbGVycy5qcyIsInNyYy9oYW5kbGVycy9saW5lLmpzIiwic3JjL2hhbmRsZXJzL3BvaW50LmpzIiwic3JjL2hhbmRsZXJzL3BvbHlnb24uanMiLCJzcmMvaGFuZGxlcnMvc3F1YXJlLmpzIiwic3JjL3N0b3JlLmpzIiwic3JjL3RoZW1lLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImB1c2Ugc3RyaWN0YDtcblxuLyoqIEEgZHJhd2luZyBjb21wb25lbnQgZm9yIG1hcGJveGdsXG4gKiBAY2xhc3MgbWFwYm94LkRyYXdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLnBvc2l0aW9uPXRvcC1yaWdodF0gQSBzdHJpbmcgaW5kaWNhdGluZyB0aGUgY29udHJvbCdzIHBvc2l0aW9uIG9uIHRoZSBtYXAuIE9wdGlvbnMgYXJlIGB0b3ByaWdodGAsIGB0b3BsZWZ0YCwgYGJvdHRvbXJpZ2h0YCwgYGJvdHRvbWxlZnRgXG4gKiBAcmV0dXJucyB7RHJhd30gYHRoaXNgXG4gKiBAZXhhbXBsZVxuICogdmFyIG1hcCA9IG5ldyBtYXBib3hnbC5NYXAoe1xuICogICBjb250YWluZXI6ICdtYXAnLFxuICogICBzdHlsZTogJ2h0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LWdsLXN0eWxlcy9zdHlsZXMvb3V0ZG9vcnMtdjcuanNvbidcbiAqIH0pO1xuICpcbiAqIC8vIEluaXRpYWxpemUgdGhlIGRyYXdpbmcgY29tcG9uZW50XG4gKiBtYXAuYWRkQ29udHJvbChuZXcgbWFwYm94Z2wuRHJhdygpKTtcbiAqL1xubWFwYm94Z2wuRHJhdyA9IHJlcXVpcmUoJy4vc3JjL2RyYXcuanMnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGFkZFRvOiBmdW5jdGlvbihtYXApIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lciA9IHRoaXMub25BZGQobWFwKTtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5wb3NpdGlvbikge1xuICAgICAgdmFyIHBvcyA9IHRoaXMub3B0aW9ucy5wb3NpdGlvbjtcbiAgICAgIHZhciBjb3JuZXIgPSBtYXAuX2NvbnRyb2xDb3JuZXJzW3Bvc107XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgbWFwYm94Z2wtY3RybC1kcmF3IG1hcGJveGdsLWN0cmwnO1xuXG4gICAgICBpZiAocG9zLmluZGV4T2YoJ2JvdHRvbScpICE9PSAtMSkge1xuICAgICAgICBjb3JuZXIuaW5zZXJ0QmVmb3JlKGNvbnRhaW5lciwgY29ybmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29ybmVyLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgIGlmICh0aGlzLm9uUmVtb3ZlKSB0aGlzLm9uUmVtb3ZlKHRoaXMuX21hcCk7XG4gICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIG1hcGJveGdsICovXG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpO1xudmFyIENvbnRyb2wgPSByZXF1aXJlKCcuL2NvbnRyb2wnKTtcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgRE9NID0gdXRpbC5ET007XG5cbi8vIENvbnRyb2wgaGFuZGxlcnNcbnZhciBQb2x5Z29uID0gcmVxdWlyZSgnLi9oYW5kbGVycy9wb2x5Z29uJyk7XG52YXIgTGluZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvbGluZScpO1xudmFyIENpcmNsZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvY2lyY2xlJyk7XG52YXIgU3F1YXJlID0gcmVxdWlyZSgnLi9oYW5kbGVycy9zcXVhcmUnKTtcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvcG9pbnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmF3O1xuXG5mdW5jdGlvbiBEcmF3KG9wdGlvbnMpIHtcbiAgdXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5EcmF3LnByb3RvdHlwZSA9IGV4dGVuZChDb250cm9sLCB7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcC1sZWZ0JyxcbiAgICBjb250cm9sczoge1xuICAgICAgbWFya2VyOiB0cnVlLFxuICAgICAgbGluZTogdHJ1ZSxcbiAgICAgIHNoYXBlOiB0cnVlLFxuICAgICAgc3F1YXJlOiB0cnVlLFxuICAgICAgY2lyY2xlOiB0cnVlXG4gICAgfVxuICB9LFxuXG4gIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgY29udHJvbENsYXNzID0gdGhpcy5fY29udHJvbENsYXNzID0gJ21hcGJveGdsLWN0cmwtZHJhdy1idG4nO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwYm94Z2wtY3RybC1ncm91cCcsIG1hcC5nZXRDb250YWluZXIoKSk7XG4gICAgdmFyIGNvbnRyb2xzID0gdGhpcy5vcHRpb25zLmNvbnRyb2xzO1xuXG4gICAgaWYgKGNvbnRyb2xzLnNoYXBlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBzaGFwZScsICdTaGFwZSB0b29sJywgdGhpcy5fZHJhd1BvbHlnb24uYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMubGluZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgbGluZScsICdMaW5lIHRvb2wnLCB0aGlzLl9kcmF3TGluZS5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5jaXJjbGUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIGNpcmNsZScsICdDaXJjbGUgdG9vbCcsIHRoaXMuX2RyYXdDaXJjbGUuYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMuc3F1YXJlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBzcXVhcmUnLCAnUmVjdGFuZ2xlIHRvb2wnLCB0aGlzLl9kcmF3U3F1YXJlLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLm1hcmtlcikgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgbWFya2VyJywgJ01hcmtlciB0b29sJywgdGhpcy5fZHJhd1BvaW50LmJpbmQobWFwKSk7XG5cbiAgICB0aGlzLl9tYXBTdGF0ZShtYXApO1xuICAgIHJldHVybiBjb250YWluZXI7XG4gIH0sXG5cbiAgX2RyYXdQb2x5Z29uOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgUG9seWdvbih0aGlzKTtcbiAgfSxcblxuICBfZHJhd0xpbmU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBMaW5lKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3Q2lyY2xlOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgQ2lyY2xlKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3U3F1YXJlOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgU3F1YXJlKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3UG9pbnQ6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBQb2ludCh0aGlzKTtcbiAgfSxcblxuICBfY3JlYXRlQnV0dG9uOiBmdW5jdGlvbihjbGFzc05hbWUsIHRpdGxlLCBmbikge1xuICAgIHZhciBhID0gRE9NLmNyZWF0ZSgnYnV0dG9uJywgY2xhc3NOYW1lLCB0aGlzLl9jb250YWluZXIsIHtcbiAgICAgIHRpdGxlOiB0aXRsZVxuICAgIH0pO1xuXG4gICAgdmFyIGNvbnRyb2xDbGFzcyA9IHRoaXMuX2NvbnRyb2xDbGFzcztcblxuICAgIGEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICh0aGlzLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIERPTS5yZW1vdmVDbGFzcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbnRyb2xDbGFzcyksICdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgZm4oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBhO1xuICB9LFxuXG4gIF9tYXBTdGF0ZTogZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGRyYXdMYXllcjtcblxuICAgIG1hcC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgbWFwLm9uKCdkcmF3LmZlYXR1cmUuY3JlYXRlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRyYXdMYXllcikge1xuICAgICAgICAgIGRyYXdMYXllci5zZXREYXRhKGUuZ2VvanNvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZHJhd0xheWVyID0gbmV3IG1hcGJveGdsLkdlb0pTT05Tb3VyY2Uoe1xuICAgICAgICAgICAgZGF0YTogZS5nZW9qc29uXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBtYXAuYWRkU291cmNlKCdkcmF3JywgZHJhd0xheWVyKTtcblxuICAgICAgICAgIHRoZW1lLmZvckVhY2goZnVuY3Rpb24oc3R5bGUpIHtcbiAgICAgICAgICAgIG1hcC5hZGRMYXllcihzdHlsZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSk7XG4gIH1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENpcmNsZTtcblxuZnVuY3Rpb24gQ2lyY2xlKG1hcCkge1xuICBjb25zb2xlLmxvZyhtYXApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBzdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG1hcCwgb3B0aW9ucykge1xuICAgIHRoaXMuX21hcCA9IG1hcDtcbiAgICB0aGlzLl9jb250YWluZXIgPSBtYXAuZ2V0Q29udGFpbmVyKCk7XG4gICAgdXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgIHRoaXMuZW5hYmxlKCk7XG4gIH0sXG5cbiAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xuICAgIGlmIChtYXApIHtcbiAgICAgIHV0aWwuRE9NLmRpc2FibGVTZWxlY3Rpb24oKTtcbiAgICAgIG1hcC5nZXRDb250YWluZXIoKS5mb2N1cygpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fY2FuY2VsRHJhd2luZy5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdtYXBib3hnbC1kcmF3LWFjdGl2YXRlZCcpO1xuICAgICAgdGhpcy5fbWFwLmZpcmUoJ2RyYXcuc3RhcnQnLCB7IGZlYXR1cmVUeXBlOiB0aGlzLnR5cGUgfSk7XG4gICAgICB0aGlzLmRyYXdTdGFydCgpO1xuICAgIH1cbiAgfSxcblxuICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB1dGlsLkRPTS5lbmFibGVTZWxlY3Rpb24oKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2NhbmNlbERyYXdpbmcuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnbWFwYm94Z2wtZHJhdy1hY3RpdmF0ZWQnKTtcbiAgICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LnN0b3AnLCB7IGZlYXR1cmVUeXBlOiB0aGlzLnR5cGUgfSk7XG4gICAgICB0aGlzLmRyYXdTdG9wKCk7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24odHlwZSwgY29vcmRpbmF0ZXMpIHtcbiAgICB2YXIgZmVhdHVyZSA9IHN0b3JlLnNldCh0eXBlLCBjb29yZGluYXRlcyk7XG4gICAgdGhpcy5fbWFwLmZpcmUoJ2RyYXcuZmVhdHVyZS5jcmVhdGVkJywge2dlb2pzb246IHN0b3JlLmdldEFsbCgpfSk7XG4gICAgdGhpcy5fY3JlYXRlZChmZWF0dXJlKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5yZXBlYXRNb2RlKSB0aGlzLmRpc2FibGUoKTtcbiAgfSxcblxuICBfY3JlYXRlZDogZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LmNyZWF0ZWQnLCB7XG4gICAgICBmZWF0dXJlVHlwZTogdGhpcy50eXBlLFxuICAgICAgZmVhdHVyZTogZmVhdHVyZVxuICAgIH0pO1xuICB9LFxuXG4gIF9jYW5jZWxEcmF3aW5nOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHsgLy8gZXNjXG4gICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICB9XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGdsb2JhbCBtYXBib3hnbCAqL1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBIYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIERPTSA9IHV0aWwuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmU7XG5cbmZ1bmN0aW9uIExpbmUobWFwKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIGRhc2hEaXN0YW5jZTogMjAsXG4gICAgcmVwZWF0TW9kZTogdHJ1ZSxcbiAgfTtcblxuICB0aGlzLnR5cGUgPSAnTGluZVN0cmluZyc7XG4gIHRoaXMuaW5pdGlhbGl6ZShtYXAsIG9wdGlvbnMpO1xufVxuXG5MaW5lLnByb3RvdHlwZSA9IGV4dGVuZChIYW5kbGVycywge1xuXG4gIGRyYXdTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuXG4gICAgICAvLyBDb250YWluZXIgdG8gaG9sZCBvbiB0byBhblxuICAgICAgLy8gQXJyYXkgcG9pbnRzIG9mIGNvb3JkaW5hdGVzXG4gICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuX21hcC5nZXRDb250YWluZXIoKTtcblxuICAgICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5fb25Nb3VzZURvd24oZSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbk1vdXNlTW92ZShlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbk1vdXNlVXAoZSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICB0aGlzLl9tYXAub24oJ3pvb21lbmQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uWm9vbUVuZChlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuICB9LFxuXG4gIGRyYXdTdG9wOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl9tYXAub2ZmKCdjbGljaycsIHRoaXMuX29uQ2xpY2spO1xuICAgIH1cbiAgfSxcblxuICBfb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgIC8vIHZhciBjID0gdGhpcy5fbWFwLnVucHJvamVjdChbZS5wb2ludC54LCBlLnBvaW50LnldKTtcbiAgICAvLyB2YXIgcG9pbnQgPSBbYy5sbmcsIGMubGF0XTtcbiAgICAvLyB0aGlzLmNyZWF0ZSh0aGlzLnR5cGUsIHBvaW50KTtcbiAgfSxcblxuICBfb25Nb3VzZURvd246IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcG9pbnQgPSB0aGlzLl9tb3VzZVBvcyhlKTtcbiAgICB0aGlzLl9jdXJyZW50TGF0TG5nID0gdGhpcy5fbWFwLnVucHJvamVjdChbcG9pbnQueCwgcG9pbnQueV0pO1xuICB9LFxuXG4gIF9vbk1vdXNlTW92ZTogZnVuY3Rpb24oZSkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50TGF0TG5nKSB7XG4gICAgICB2YXIgcG9pbnQgPSB0aGlzLl9tb3VzZVBvcyhlKTtcbiAgICAgIHZhciBuZXdQb3MgPSB0aGlzLl9tYXAudW5wcm9qZWN0KFtwb2ludC54LCBwb2ludC55XSk7XG4gICAgICB0aGlzLl91cGRhdGVHdWlkZShuZXdQb3MpO1xuICAgIH1cbiAgfSxcblxuICBfb25Nb3VzZVVwOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRMYXRMbmcpIHtcbiAgICAgIHZhciBwb2ludCA9IHRoaXMuX21vdXNlUG9zKGUpO1xuICAgICAgdGhpcy5fYWRkVmVydGV4KHRoaXMuX21hcC51bnByb2plY3QoW3BvaW50LngsIHBvaW50LnldKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fY3VycmVudExhdExuZyA9IG51bGw7XG4gIH0sXG5cbiAgX21vdXNlUG9zOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGVsID0gdGhpcy5fbWFwLmdldENvbnRhaW5lcigpO1xuICAgIHZhciByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIG5ldyBtYXBib3hnbC5Qb2ludChcbiAgICAgIGUuY2xpZW50WCAtIHJlY3QubGVmdCAtIGVsLmNsaWVudExlZnQsXG4gICAgICBlLmNsaWVudFkgLSByZWN0LnRvcCAtIGVsLmNsaWVudFRvcFxuICAgICk7XG4gIH0sXG5cbiAgX2NyZWF0ZUhhbmRsZXM6IGZ1bmN0aW9uKGxhdExuZykge1xuICAgIC8vIDEuIFRPRE8gVGFrZSB0aGUgY3VycmVudCBjb29yZGluYXRlcy5cbiAgICAvLyAyLiB1bnByb2plY3QgYW5kIHBsb3QgYSBkaXYgb24gdGhlIG1hcFxuICAgIC8vIHRvIGFjdCBhcyBhIGludGVyYWN0aXZlIGNvbnRyb2wgdGhhdCBsaXN0ZW5zXG4gICAgLy8gdG8gYSBjbGljayBldmVudCB0byBjb21wbGV0ZSBhIHBhdGguXG4gICAgLy8gVGhlIGNsaWNrIGV2ZW50IHNob3VsZCByZXNwb25kIHRvIHRoaXMuX2ZpbmlzaFNoYXBlKCk7XG4gIH0sXG5cbiAgX2FkZFZlcnRleDogZnVuY3Rpb24obGF0TG5nKSB7XG4gICAgdGhpcy5fbm9kZXMucHVzaChsYXRMbmcpO1xuICAgIHRoaXMuX2NyZWF0ZUhhbmRsZXMoKTtcbiAgICB0aGlzLl92ZXJ0ZXhDaGFuZ2VkKGxhdExuZywgdHJ1ZSk7XG4gIH0sXG5cbiAgX3ZlcnRleENoYW5nZWQ6IGZ1bmN0aW9uKGxhdExuZywgYWRkZWQpIHtcbiAgICAvLyB0aGlzLl91cGRhdGVSdW5uaW5nTWVhc3VyZShsYXRsbmcsIGFkZGVkKTtcbiAgICB0aGlzLl9jbGVhckd1aWRlcygpO1xuICB9LFxuXG4gIF9vblpvb21FbmQ6IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLl91cGRhdGVHdWlkZSgpO1xuICB9LFxuXG4gIF91cGRhdGVHdWlkZTogZnVuY3Rpb24obmV3UG9zKSB7XG4gICAgaWYgKHRoaXMuX25vZGVzLmxlbmd0aCkge1xuICAgICAgdmFyIG5vZGVzID0gdGhpcy5fbm9kZXM7XG4gICAgICBuZXdQb3MgPSBuZXdQb3MgfHwgdGhpcy5fbWFwLnByb2plY3QodGhpcy5fY3VycmVudExhdExuZyk7XG5cbiAgICAgIHRoaXMuX2NsZWFyR3VpZGVzKCk7XG5cbiAgICAgIC8vIERyYXcgdGhlIG5ldyBndWlkZSBsaW5lXG4gICAgICB0aGlzLl9kcmF3R3VpZGUoXG4gICAgICAgIHRoaXMuX21hcC5wcm9qZWN0KG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdKSxcbiAgICAgICAgbmV3UG9zXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBfZHJhd0d1aWRlOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIGxlbmd0aCA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KE1hdGgucG93KChiLnggLSBhLngpLCAyKSArIE1hdGgucG93KChiLnkgLSBhLnkpLCAyKSkpO1xuICAgIHZhciBkYXNoRGlzdGFuY2UgPSB0aGlzLm9wdGlvbnMuZGFzaERpc3RhbmNlO1xuXG4gICAgaWYgKCF0aGlzLl9ndWlkZXNDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2d1aWRlc0NvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXBib3hnbC1kcmF3LWd1aWRlcycsIHRoaXMuX21hcC5nZXRDb250YWluZXIoKSk7XG4gICAgfVxuXG4gICAgLy8gRHJhdyBhIGRhc2ggZXZlcnkgR3VpbGRlTGluZURpc3RhbmNlXG4gICAgdmFyIGZyYWN0aW9uLCBkYXNoUG9pbnQsIGRhc2g7XG4gICAgZm9yICh2YXIgaTsgaSA8IGxlbmd0aDsgaSArPSBkYXNoRGlzdGFuY2UpIHtcbiAgICAgIC8vIFdvcmsgb3V0IGEgZnJhY3Rpb24gYWxvbmcgbGluZSB3ZSBhcmVcbiAgICAgIGZyYWN0aW9uID0gaSAvIGxlbmd0aDtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGEgbmV3IHgseSBwb2ludFxuICAgICAgZGFzaFBvaW50ID0ge1xuICAgICAgICB4OiBNYXRoLmZsb29yKChhLnggKiAoMSAtIGZyYWN0aW9uKSkgKyAoZnJhY3Rpb24gKiBiLngpKSxcbiAgICAgICAgeTogTWF0aC5mbG9vcigoYS55ICogKDEgLSBmcmFjdGlvbikpICsgKGZyYWN0aW9uICogYi55KSlcbiAgICAgIH07XG5cbiAgICAgIC8vIEFkZCBndWlkZSBkYXNoIHRvIGd1aWRlIGNvbnRhaW5lclxuICAgICAgZGFzaCA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXBib3hnbC1kcmF3LWd1aWRlLWRhc2gnLCB0aGlzLl9ndWlkZXNDb250YWluZXIpO1xuXG4gICAgICBET00uc2V0VHJhbnNmb3JtKGRhc2gsIGRhc2hQb2ludCk7XG4gICAgfVxuICB9LFxuXG4gIF9jbGVhckd1aWRlczogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2d1aWRlc0NvbnRhaW5lcikge1xuICAgICAgd2hpbGUgKHRoaXMuX2d1aWRlc0NvbnRhaW5lci5maXJzdENoaWxkKSB7XG4gICAgICAgIHRoaXMuX2d1aWRlc0NvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9ndWlkZXNDb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBIYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDtcblxuZnVuY3Rpb24gUG9pbnQobWFwKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIHJlcGVhdE1vZGU6IHRydWVcbiAgfTtcblxuICB0aGlzLnR5cGUgPSAnUG9pbnQnO1xuICB0aGlzLmluaXRpYWxpemUobWFwLCBvcHRpb25zKTtcbn1cblxuUG9pbnQucHJvdG90eXBlID0gZXh0ZW5kKEhhbmRsZXJzLCB7XG5cbiAgZHJhd1N0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl9tYXAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbkNsaWNrKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH0sXG5cbiAgZHJhd1N0b3A6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2NsaWNrJywgdGhpcy5fb25DbGljayk7XG4gICAgfVxuICB9LFxuXG4gIF9vbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGMgPSB0aGlzLl9tYXAudW5wcm9qZWN0KFtlLnBvaW50LngsIGUucG9pbnQueV0pO1xuICAgIHZhciBwb2ludCA9IFtjLmxuZywgYy5sYXRdO1xuICAgIHRoaXMuY3JlYXRlKHRoaXMudHlwZSwgcG9pbnQpO1xuICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBMaW5lID0gcmVxdWlyZSgnLi9saW5lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9seWdvbjtcblxuZnVuY3Rpb24gUG9seWdvbihtYXApIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgcmVwZWF0TW9kZTogdHJ1ZVxuICB9O1xuXG4gIHRoaXMudHlwZSA9ICdQb2x5Z29uJztcbiAgdGhpcy5pbml0aWFsaXplKG1hcCwgb3B0aW9ucyk7XG59XG5cblBvbHlnb24ucHJvdG90eXBlID0gZXh0ZW5kKExpbmUsIHtcblxuICBkcmF3U3RhcnQ6IGZ1bmN0aW9uKCkge30sXG5cbiAgZHJhd1N0b3A6IGZ1bmN0aW9uKCkge30sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uKGUpIHt9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNxdWFyZTtcblxuZnVuY3Rpb24gU3F1YXJlKG1hcCkge1xuICBjb25zb2xlLmxvZyhtYXApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBnZXRBbGw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICB9LFxuXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETyBnZXQgYSBzcGVjaWZpYyBnZW9qc29uIG9iamVjdFxuICB9LFxuXG4gIHVuc2V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPIHVuZG8gbWFuYWdlbWVudC5cbiAgICB0aGlzLl9oaXN0b3J5ID0gdGhpcy5nZXRBbGwoKS5mZWF0dXJlcztcbiAgICAvLyBUT0RPIHJlbW92ZSBhIHNwZWNpZmljIGdlb2pzb24gb2JqZWN0XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbih0eXBlLCBjb29yZGluYXRlcykge1xuXG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgY29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVzXG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX2RhdGEuZmVhdHVyZXMucHVzaChvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgX2RhdGE6IHtcbiAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxuICAgIGZlYXR1cmVzOiBbXVxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2ludHNcIixcbiAgICBcInR5cGVcIjogXCJzeW1ib2xcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvaW50XCJdXSxcbiAgICBcImxheW91dFwiOiB7XG4gICAgICBcImljb24taW1hZ2VcIjogXCJkb3Quc2RmXCIsXG4gICAgICBcImljb24taWdub3JlLXBsYWNlbWVudFwiOiB0cnVlLFxuICAgICAgXCJpY29uLW1heC1zaXplXCI6IDEsXG4gICAgICBcImljb24tYWxsb3ctb3ZlcmxhcFwiOiB0cnVlXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwiaWNvbi1jb2xvclwiOiBcIiNmMWYwNzVcIixcbiAgICAgIFwiaWNvbi1zaXplXCI6IDJcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2x5Z29uc1wiLFxuICAgIFwidHlwZVwiOiBcImZpbGxcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvbHlnb25cIl1dLFxuICAgIFwicGFpbnRcIjoge1xuICAgICAgXCJmaWxsLWNvbG9yXCI6IFwiIzU2Yjg4MVwiLFxuICAgICAgXCJmaWxsLW91dGxpbmUtY29sb3JcIjogXCIjNTZiODgxXCIsXG4gICAgICBcImZpbGwtb3BhY2l0eVwiOiAwLjVcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2x5Z29uLXN0cm9rZVwiLFxuICAgIFwidHlwZVwiOiBcImxpbmVcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvbHlnb25cIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwibGluZS1jYXBcIjogXCJyb3VuZFwiLFxuICAgICAgXCJsaW5lLWpvaW5cIjogXCJyb3VuZFwiXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwibGluZS1jb2xvclwiOiBcIiM1NmI4ODFcIixcbiAgICAgIFwibGluZS13aWR0aFwiOiAyXG4gICAgfVxuICB9LCB7XG4gICAgXCJpZFwiOiBcImdsLWRyYXctbGluZVwiLFxuICAgIFwidHlwZVwiOiBcImxpbmVcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIkxpbmVTdHJpbmdcIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwibGluZS1jYXBcIjogXCJyb3VuZFwiLFxuICAgICAgXCJsaW5lLWpvaW5cIjogXCJyb3VuZFwiXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwibGluZS1jb2xvclwiOiBcIiM4YThhY2JcIixcbiAgICAgIFwibGluZS13aWR0aFwiOiA0XG4gICAgfVxuICB9XG5dO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBNZXJnZSB1c2VyIHByb3ZpZGVkIG9wdGlvbnMgb2JqZWN0IHdpdGggYSBkZWZhdWx0IG9uZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogQ29udGFpbmluZyBhbiBvcHRpb25zIGtleSB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gKiBAcGFyYW0ge29wdGlvbnN9IG9wdGlvbnMgUHJvdmlkZWQgb3B0aW9ucyB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5tb2R1bGUuZXhwb3J0cy5zZXRPcHRpb25zID0gZnVuY3Rpb24ob2JqLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJ29wdGlvbnMnKSkge1xuICAgICAgICBvYmoub3B0aW9ucyA9IG9iai5vcHRpb25zID8gT2JqZWN0LmNyZWF0ZShvYmoub3B0aW9ucykgOiB7fTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG4gICAgICAgIG9iai5vcHRpb25zW2ldID0gb3B0aW9uc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIG9iai5vcHRpb25zO1xufTtcblxubW9kdWxlLmV4cG9ydHMuRE9NID0ge307XG5cbi8qIEJ1aWxkcyBET00gZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFnIEVsZW1lbnQgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IFtjbGFzc05hbWVdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbnRhaW5lcl0gRE9NIGVsZW1lbnQgdG8gYXBwZW5kIHRvXG4gKiBAcGFyYW0ge09iamVjdH0gW2F0dHJidXRlc10gT2JqZWN0IGNvbnRhaW5pbmcgYXR0cmlidXRlcyB0byBhcHBseSB0byBhblxuICogZWxlbWVudC4gQXR0cmlidXRlIG5hbWUgY29ycmVzcG9uZHMgdG8gdGhlIGtleS5cbiAqIEByZXR1cm5zIHtlbH0gVGhlIGRvbSBlbGVtZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzLkRPTS5jcmVhdGUgPSBmdW5jdGlvbih0YWcsIGNsYXNzTmFtZSwgY29udGFpbmVyLCBhdHRyaWJ1dGVzKSB7XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAoYXR0cmlidXRlcykge1xuICAgIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbiAgfVxuICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuICByZXR1cm4gZWw7XG59O1xuXG4vKiBSZW1vdmVzIGNsYXNzZXMgZnJvbSBhbiBhcnJheSBvZiBET00gZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50c1xuICogQHBhcmFtIHtTdHJpbmd9IGtsYXNzXG4gKi9cbm1vZHVsZS5leHBvcnRzLkRPTS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1lbnRzLCBrbGFzcykge1xuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbihlbCkge1xuICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoa2xhc3MpO1xuICB9KTtcbn07XG5cbnZhciBkb2NTdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxuZnVuY3Rpb24gdGVzdFByb3AocHJvcHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChwcm9wc1tpXSBpbiBkb2NTdHlsZSkge1xuICAgICAgcmV0dXJuIHByb3BzW2ldO1xuICAgIH1cbiAgfVxufVxuXG52YXIgc2VsZWN0UHJvcCA9IHRlc3RQcm9wKFtcbiAgJ3VzZXJTZWxlY3QnLFxuICAnTW96VXNlclNlbGVjdCcsXG4gICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgJ21zVXNlclNlbGVjdCdcbl0pO1xuXG52YXIgdHJhbnNmb3JtUHJvcCA9IHRlc3RQcm9wKFtcbiAgJ3RyYW5zZm9ybScsXG4gICdXZWJraXRUcmFuc2Zvcm0nXG5dKTtcblxubW9kdWxlLmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24oZWwsIHZhbHVlKSB7XG4gIGVsLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdmFsdWU7XG59O1xuXG52YXIgdXNlclNlbGVjdDtcbm1vZHVsZS5leHBvcnRzLkRPTS5kaXNhYmxlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgdXNlclNlbGVjdCA9IGRvY1N0eWxlW3NlbGVjdFByb3BdO1xuICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gJ25vbmUnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5ET00uZW5hYmxlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgZG9jU3R5bGVbc2VsZWN0UHJvcF0gPSB1c2VyU2VsZWN0O1xuICB9XG59O1xuIl19
