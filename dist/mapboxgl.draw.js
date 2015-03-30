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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kcmF3LmpzIiwic3JjL2hhbmRsZXJzL2NpcmNsZS5qcyIsInNyYy9oYW5kbGVycy9oYW5kbGVycy5qcyIsInNyYy9oYW5kbGVycy9saW5lLmpzIiwic3JjL2hhbmRsZXJzL3BvaW50LmpzIiwic3JjL2hhbmRsZXJzL3BvbHlnb24uanMiLCJzcmMvaGFuZGxlcnMvc3F1YXJlLmpzIiwic3JjL3N0b3JlLmpzIiwic3JjL3RoZW1lLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJgdXNlIHN0cmljdGA7XG5cbi8qKiBBIGRyYXdpbmcgY29tcG9uZW50IGZvciBtYXBib3hnbFxuICogQGNsYXNzIG1hcGJveC5EcmF3XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5wb3NpdGlvbj10b3AtcmlnaHRdIEEgc3RyaW5nIGluZGljYXRpbmcgdGhlIGNvbnRyb2wncyBwb3NpdGlvbiBvbiB0aGUgbWFwLiBPcHRpb25zIGFyZSBgdG9wcmlnaHRgLCBgdG9wbGVmdGAsIGBib3R0b21yaWdodGAsIGBib3R0b21sZWZ0YFxuICogQHJldHVybnMge0RyYXd9IGB0aGlzYFxuICogQGV4YW1wbGVcbiAqIHZhciBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAqICAgY29udGFpbmVyOiAnbWFwJyxcbiAqICAgc3R5bGU6ICdodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1zdHlsZXMvc3R5bGVzL291dGRvb3JzLXY3Lmpzb24nXG4gKiB9KTtcbiAqXG4gKiAvLyBJbml0aWFsaXplIHRoZSBkcmF3aW5nIGNvbXBvbmVudFxuICogbWFwLmFkZENvbnRyb2wobmV3IG1hcGJveGdsLkRyYXcoKSk7XG4gKi9cbm1hcGJveGdsLkRyYXcgPSByZXF1aXJlKCcuL3NyYy9kcmF3LmpzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgdmFyIHRhcmdldCA9IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBhZGRUbzogZnVuY3Rpb24obWFwKSB7XG4gICAgdGhpcy5fbWFwID0gbWFwO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSB0aGlzLm9uQWRkKG1hcCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgIHZhciBwb3MgPSB0aGlzLm9wdGlvbnMucG9zaXRpb247XG4gICAgICB2YXIgY29ybmVyID0gbWFwLl9jb250cm9sQ29ybmVyc1twb3NdO1xuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSArPSAnIG1hcGJveGdsLWN0cmwtZHJhdyBtYXBib3hnbC1jdHJsJztcblxuICAgICAgaWYgKHBvcy5pbmRleE9mKCdib3R0b20nKSAhPT0gLTEpIHtcbiAgICAgICAgY29ybmVyLmluc2VydEJlZm9yZShjb250YWluZXIsIGNvcm5lci5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvcm5lci5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICBpZiAodGhpcy5vblJlbW92ZSkgdGhpcy5vblJlbW92ZSh0aGlzLl9tYXApO1xuICAgIHRoaXMuX21hcCA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGdsb2JhbCBtYXBib3hnbCAqL1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG52YXIgdGhlbWUgPSByZXF1aXJlKCcuL3RoZW1lJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIERPTSA9IHV0aWwuRE9NO1xuXG4vLyBDb250cm9sIGhhbmRsZXJzXG52YXIgUG9seWdvbiA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvcG9seWdvbicpO1xudmFyIExpbmUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL2xpbmUnKTtcbnZhciBDaXJjbGUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL2NpcmNsZScpO1xudmFyIFNxdWFyZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvc3F1YXJlJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2hhbmRsZXJzL3BvaW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhdztcblxuZnVuY3Rpb24gRHJhdyhvcHRpb25zKSB7XG4gIHV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbn1cblxuRHJhdy5wcm90b3R5cGUgPSBleHRlbmQoQ29udHJvbCwge1xuICBvcHRpb25zOiB7XG4gICAgcG9zaXRpb246ICd0b3AtbGVmdCcsXG4gICAgY29udHJvbHM6IHtcbiAgICAgIG1hcmtlcjogdHJ1ZSxcbiAgICAgIGxpbmU6IHRydWUsXG4gICAgICBzaGFwZTogdHJ1ZSxcbiAgICAgIHNxdWFyZTogdHJ1ZSxcbiAgICAgIGNpcmNsZTogdHJ1ZVxuICAgIH1cbiAgfSxcblxuICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGNvbnRyb2xDbGFzcyA9IHRoaXMuX2NvbnRyb2xDbGFzcyA9ICdtYXBib3hnbC1jdHJsLWRyYXctYnRuJztcbiAgICB2YXIgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21hcGJveGdsLWN0cmwtZ3JvdXAnLCBtYXAuZ2V0Q29udGFpbmVyKCkpO1xuICAgIHZhciBjb250cm9scyA9IHRoaXMub3B0aW9ucy5jb250cm9scztcblxuICAgIGlmIChjb250cm9scy5zaGFwZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgc2hhcGUnLCAnU2hhcGUgdG9vbCcsIHRoaXMuX2RyYXdQb2x5Z29uLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLmxpbmUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIGxpbmUnLCAnTGluZSB0b29sJywgdGhpcy5fZHJhd0xpbmUuYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMuY2lyY2xlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBjaXJjbGUnLCAnQ2lyY2xlIHRvb2wnLCB0aGlzLl9kcmF3Q2lyY2xlLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLnNxdWFyZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgc3F1YXJlJywgJ1JlY3RhbmdsZSB0b29sJywgdGhpcy5fZHJhd1NxdWFyZS5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5tYXJrZXIpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIG1hcmtlcicsICdNYXJrZXIgdG9vbCcsIHRoaXMuX2RyYXdQb2ludC5iaW5kKG1hcCkpO1xuXG4gICAgdGhpcy5fbWFwU3RhdGUobWFwKTtcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9LFxuXG4gIF9kcmF3UG9seWdvbjogZnVuY3Rpb24oKSB7XG4gICAgbmV3IFBvbHlnb24odGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdMaW5lOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgTGluZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd0NpcmNsZTogZnVuY3Rpb24oKSB7XG4gICAgbmV3IENpcmNsZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd1NxdWFyZTogZnVuY3Rpb24oKSB7XG4gICAgbmV3IFNxdWFyZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd1BvaW50OiBmdW5jdGlvbigpIHtcbiAgICBuZXcgUG9pbnQodGhpcyk7XG4gIH0sXG5cbiAgX2NyZWF0ZUJ1dHRvbjogZnVuY3Rpb24oY2xhc3NOYW1lLCB0aXRsZSwgZm4pIHtcbiAgICB2YXIgYSA9IERPTS5jcmVhdGUoJ2J1dHRvbicsIGNsYXNzTmFtZSwgdGhpcy5fY29udGFpbmVyLCB7XG4gICAgICB0aXRsZTogdGl0bGVcbiAgICB9KTtcblxuICAgIHZhciBjb250cm9sQ2xhc3MgPSB0aGlzLl9jb250cm9sQ2xhc3M7XG5cbiAgICBhLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAodGhpcy5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBET00ucmVtb3ZlQ2xhc3MoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb250cm9sQ2xhc3MpLCAnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIGZuKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYTtcbiAgfSxcblxuICBfbWFwU3RhdGU6IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBkcmF3TGF5ZXI7XG5cbiAgICBtYXAub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIG1hcC5vbignZHJhdy5mZWF0dXJlLmNyZWF0ZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkcmF3TGF5ZXIpIHtcbiAgICAgICAgICBkcmF3TGF5ZXIuc2V0RGF0YShlLmdlb2pzb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRyYXdMYXllciA9IG5ldyBtYXBib3hnbC5HZW9KU09OU291cmNlKHtcbiAgICAgICAgICAgIGRhdGE6IGUuZ2VvanNvblxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgbWFwLmFkZFNvdXJjZSgnZHJhdycsIGRyYXdMYXllcik7XG5cbiAgICAgICAgICB0aGVtZS5mb3JFYWNoKGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIoc3R5bGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBDaXJjbGU7XG5cbmZ1bmN0aW9uIENpcmNsZShtYXApIHtcbiAgY29uc29sZS5sb2cobWFwKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBpbml0aWFsaXplOiBmdW5jdGlvbihtYXAsIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdGhpcy5fY29udGFpbmVyID0gbWFwLmdldENvbnRhaW5lcigpO1xuICAgIHV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmVuYWJsZSgpO1xuICB9LFxuXG4gIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hcCA9IHRoaXMuX21hcDtcbiAgICBpZiAobWFwKSB7XG4gICAgICB1dGlsLkRPTS5kaXNhYmxlU2VsZWN0aW9uKCk7XG4gICAgICBtYXAuZ2V0Q29udGFpbmVyKCkuZm9jdXMoKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2NhbmNlbERyYXdpbmcuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9jb250YWluZXIuY2xhc3NMaXN0LmFkZCgnbWFwYm94Z2wtZHJhdy1hY3RpdmF0ZWQnKTtcbiAgICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LnN0YXJ0JywgeyBmZWF0dXJlVHlwZTogdGhpcy50eXBlIH0pO1xuICAgICAgdGhpcy5kcmF3U3RhcnQoKTtcbiAgICB9XG4gIH0sXG5cbiAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgdXRpbC5ET00uZW5hYmxlU2VsZWN0aW9uKCk7XG4gICAgICB0aGlzLl9jb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9jYW5jZWxEcmF3aW5nLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ21hcGJveGdsLWRyYXctYWN0aXZhdGVkJyk7XG4gICAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5zdG9wJywgeyBmZWF0dXJlVHlwZTogdGhpcy50eXBlIH0pO1xuICAgICAgdGhpcy5kcmF3U3RvcCgpO1xuICAgIH1cbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uKHR5cGUsIGNvb3JkaW5hdGVzKSB7XG4gICAgdmFyIGZlYXR1cmUgPSBzdG9yZS5zZXQodHlwZSwgY29vcmRpbmF0ZXMpO1xuICAgIHRoaXMuX21hcC5maXJlKCdkcmF3LmZlYXR1cmUuY3JlYXRlZCcsIHtnZW9qc29uOiBzdG9yZS5nZXRBbGwoKX0pO1xuICAgIHRoaXMuX2NyZWF0ZWQoZmVhdHVyZSk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucmVwZWF0TW9kZSkgdGhpcy5kaXNhYmxlKCk7XG4gIH0sXG5cbiAgX2NyZWF0ZWQ6IGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5jcmVhdGVkJywge1xuICAgICAgZmVhdHVyZVR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZlYXR1cmU6IGZlYXR1cmVcbiAgICB9KTtcbiAgfSxcblxuICBfY2FuY2VsRHJhd2luZzogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDI3KSB7IC8vIGVzY1xuICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgfVxuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBIYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIERPTSA9IHV0aWwuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmU7XG5cbmZ1bmN0aW9uIExpbmUobWFwKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIGRhc2hEaXN0YW5jZTogMjAsXG4gICAgcmVwZWF0TW9kZTogdHJ1ZSxcbiAgfTtcblxuICB0aGlzLnR5cGUgPSAnTGluZVN0cmluZyc7XG4gIHRoaXMuaW5pdGlhbGl6ZShtYXAsIG9wdGlvbnMpO1xufVxuXG5MaW5lLnByb3RvdHlwZSA9IGV4dGVuZChIYW5kbGVycywge1xuXG4gIGRyYXdTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX21hcCkge1xuXG4gICAgICAvLyBDb250YWluZXIgdG8gaG9sZCBvbiB0byBhblxuICAgICAgLy8gQXJyYXkgcG9pbnRzIG9mIGNvb3JkaW5hdGVzXG4gICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuXG4gICAgICB0aGlzLl9tYXAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbkNsaWNrKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgdGhpcy5fbWFwLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uTW91c2VEb3duKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgdGhpcy5fbWFwLm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uTW91c2VNb3ZlKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgdGhpcy5fbWFwLm9uKCdtb3VzZVVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbk1vdXNlVXAoZSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICB0aGlzLl9tYXAub24oJ3pvb21lbmQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX29uWm9vbUVuZChlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuICB9LFxuXG4gIGRyYXdTdG9wOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl9tYXAub2ZmKCdjbGljaycsIHRoaXMuX29uQ2xpY2spO1xuICAgIH1cbiAgfSxcblxuICBfb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgIHZhciBjID0gdGhpcy5fbWFwLnVucHJvamVjdChbZS5wb2ludC54LCBlLnBvaW50LnldKTtcbiAgICB2YXIgcG9pbnQgPSBbYy5sbmcsIGMubGF0XTtcbiAgICB0aGlzLmNyZWF0ZSh0aGlzLnR5cGUsIHBvaW50KTtcbiAgfSxcblxuICBfb25Nb3VzZURvd246IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLl9jdXJyZW50TGF0TG5nID0gdGhpcy5fbWFwLnVucHJvamVjdChbZS5wb2ludC54LCBlLnBvaW50LnldKTtcbiAgfSxcblxuICBfb25Nb3VzZU1vdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgbmV3UG9zID0gdGhpcy5fbWFwLnVucHJvamVjdChbZS5wb2ludC54LCBlLnBvaW50LnldKTtcbiAgICB0aGlzLl91cGRhdGVHdWlkZShuZXdQb3MpO1xuICB9LFxuXG4gIF9vbk1vdXNlVXA6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudExhdExuZykge1xuICAgICAgdGhpcy5hZGRWZXJ0ZXgodGhpcy5fbWFwLnVucHJvamVjdChbZS5wb2ludC54LCBlLnBvaW50LnldKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fY3VycmVudExhdExuZyA9IG51bGw7XG4gIH0sXG5cbiAgX2NyZWF0ZUhhbmRsZXM6IGZ1bmN0aW9uKGxhdExuZykge1xuICAgIC8vIDEuIFRPRE8gVGFrZSB0aGUgY3VycmVudCBjb29yZGluYXRlcy5cbiAgICAvLyAyLiB1bnByb2plY3QgYW5kIHBsb3QgYSBkaXYgb24gdGhlIG1hcFxuICAgIC8vIHRvIGFjdCBhcyBhIGludGVyYWN0aXZlIGNvbnRyb2wgdGhhdCBsaXN0ZW5zXG4gICAgLy8gdG8gYSBjbGljayBldmVudCB0byBjb21wbGV0ZSBhIHBhdGguXG4gICAgLy8gVGhlIGNsaWNrIGV2ZW50IHNob3VsZCByZXNwb25kIHRvIHRoaXMuX2ZpbmlzaFNoYXBlKCk7XG4gIH0sXG5cbiAgX2FkZFZlcnRleDogZnVuY3Rpb24obGF0TG5nKSB7XG4gICAgdGhpcy5fbm9kZXMucHVzaChsYXRMbmcpO1xuICAgIHRoaXMuX2NyZWF0ZUhhbmRsZXMoKTtcbiAgICB0aGlzLl92ZXJ0ZXhDaGFuZ2VkKGxhdExuZywgdHJ1ZSk7XG4gIH0sXG5cbiAgX3ZlcnRleENoYW5nZWQ6IGZ1bmN0aW9uKGxhdExuZywgYWRkZWQpIHtcbiAgICAvLyB0aGlzLl91cGRhdGVSdW5uaW5nTWVhc3VyZShsYXRsbmcsIGFkZGVkKTtcbiAgICB0aGlzLl9jbGVhckd1aWRlcygpO1xuICB9LFxuXG4gIF9vblpvb21FbmQ6IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLl91cGRhdGVHdWlkZSgpO1xuICB9LFxuXG4gIF91cGRhdGVHdWlkZTogZnVuY3Rpb24obmV3UG9zKSB7XG4gICAgaWYgKHRoaXMuX25vZGVzLmxlbmd0aCkge1xuICAgICAgdmFyIG5vZGVzID0gdGhpcy5fbm9kZXM7XG4gICAgICBuZXdQb3MgPSBuZXdQb3MgfHwgdGhpcy5fbWFwLnByb2plY3QodGhpcy5fY3VycmVudExhdExuZyk7XG5cbiAgICAgIHRoaXMuX2NsZWFyR3VpZGVzKCk7XG5cbiAgICAgIC8vIERyYXcgdGhlIG5ldyBndWlkZSBsaW5lXG4gICAgICB0aGlzLl9kcmF3R3VpZGUoXG4gICAgICAgIHRoaXMuX21hcC5wcm9qZWN0KG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdKSxcbiAgICAgICAgbmV3UG9zXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBfZHJhd0d1aWRlOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIGxlbmd0aCA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KE1hdGgucG93KChiLnggLSBhLngpLCAyKSArIE1hdGgucG93KChiLnkgLSBhLnkpLCAyKSkpO1xuICAgIHZhciBkYXNoRGlzdGFuY2UgPSB0aGlzLm9wdGlvbnMuZGFzaERpc3RhbmNlO1xuXG4gICAgaWYgKCF0aGlzLl9ndWlkZXNDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2d1aWRlc0NvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXBib3hnbC1kcmF3LWd1aWRlcycsIHRoaXMuX21hcC5nZXRDb250YWluZXIoKSk7XG4gICAgfVxuXG4gICAgLy8gRHJhdyBhIGRhc2ggZXZlcnkgR3VpbGRlTGluZURpc3RhbmNlXG4gICAgdmFyIGZyYWN0aW9uLCBkYXNoUG9pbnQsIGRhc2g7XG4gICAgZm9yICh2YXIgaTsgaSA8IGxlbmd0aDsgaSArPSBkYXNoRGlzdGFuY2UpIHtcbiAgICAgIC8vIFdvcmsgb3V0IGEgZnJhY3Rpb24gYWxvbmcgbGluZSB3ZSBhcmVcbiAgICAgIGZyYWN0aW9uID0gaSAvIGxlbmd0aDtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGEgbmV3IHgseSBwb2ludFxuICAgICAgZGFzaFBvaW50ID0ge1xuICAgICAgICB4OiBNYXRoLmZsb29yKChhLnggKiAoMSAtIGZyYWN0aW9uKSkgKyAoZnJhY3Rpb24gKiBiLngpKSxcbiAgICAgICAgeTogTWF0aC5mbG9vcigoYS55ICogKDEgLSBmcmFjdGlvbikpICsgKGZyYWN0aW9uICogYi55KSlcbiAgICAgIH07XG5cbiAgICAgIC8vIEFkZCBndWlkZSBkYXNoIHRvIGd1aWRlIGNvbnRhaW5lclxuICAgICAgZGFzaCA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXBib3hnbC1kcmF3LWd1aWRlLWRhc2gnLCB0aGlzLl9ndWlkZXNDb250YWluZXIpO1xuXG4gICAgICBET00uc2V0VHJhbnNmb3JtKGRhc2gsIGRhc2hQb2ludCk7XG4gICAgfVxuICB9LFxuXG4gIF9jbGVhckd1aWRlczogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2d1aWRlc0NvbnRhaW5lcikge1xuICAgICAgd2hpbGUgKHRoaXMuX2d1aWRlc0NvbnRhaW5lci5maXJzdENoaWxkKSB7XG4gICAgICAgIHRoaXMuX2d1aWRlc0NvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9ndWlkZXNDb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBIYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDtcblxuZnVuY3Rpb24gUG9pbnQobWFwKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIHJlcGVhdE1vZGU6IHRydWVcbiAgfTtcblxuICB0aGlzLnR5cGUgPSAnUG9pbnQnO1xuICB0aGlzLmluaXRpYWxpemUobWFwLCBvcHRpb25zKTtcbn1cblxuUG9pbnQucHJvdG90eXBlID0gZXh0ZW5kKEhhbmRsZXJzLCB7XG5cbiAgZHJhd1N0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl9tYXAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbkNsaWNrKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH0sXG5cbiAgZHJhd1N0b3A6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2NsaWNrJywgdGhpcy5fb25DbGljayk7XG4gICAgfVxuICB9LFxuXG4gIF9vbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGMgPSB0aGlzLl9tYXAudW5wcm9qZWN0KFtlLnBvaW50LngsIGUucG9pbnQueV0pO1xuICAgIHZhciBwb2ludCA9IFtjLmxuZywgYy5sYXRdO1xuICAgIHRoaXMuY3JlYXRlKHRoaXMudHlwZSwgcG9pbnQpO1xuICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBMaW5lID0gcmVxdWlyZSgnLi9saW5lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9seWdvbjtcblxuZnVuY3Rpb24gUG9seWdvbihtYXApIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgcmVwZWF0TW9kZTogdHJ1ZVxuICB9O1xuXG4gIHRoaXMudHlwZSA9ICdQb2x5Z29uJztcbiAgdGhpcy5pbml0aWFsaXplKG1hcCwgb3B0aW9ucyk7XG59XG5cblBvbHlnb24ucHJvdG90eXBlID0gZXh0ZW5kKExpbmUsIHtcblxuICBkcmF3U3RhcnQ6IGZ1bmN0aW9uKCkge30sXG5cbiAgZHJhd1N0b3A6IGZ1bmN0aW9uKCkge30sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uKGUpIHt9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNxdWFyZTtcblxuZnVuY3Rpb24gU3F1YXJlKG1hcCkge1xuICBjb25zb2xlLmxvZyhtYXApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBnZXRBbGw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICB9LFxuXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETyBnZXQgYSBzcGVjaWZpYyBnZW9qc29uIG9iamVjdFxuICB9LFxuXG4gIHVuc2V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPIHVuZG8gbWFuYWdlbWVudC5cbiAgICB0aGlzLl9oaXN0b3J5ID0gdGhpcy5nZXRBbGwoKS5mZWF0dXJlcztcbiAgICAvLyBUT0RPIHJlbW92ZSBhIHNwZWNpZmljIGdlb2pzb24gb2JqZWN0XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbih0eXBlLCBjb29yZGluYXRlcykge1xuXG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgY29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVzXG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX2RhdGEuZmVhdHVyZXMucHVzaChvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgX2RhdGE6IHtcbiAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxuICAgIGZlYXR1cmVzOiBbXVxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2ludHNcIixcbiAgICBcInR5cGVcIjogXCJzeW1ib2xcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvaW50XCJdXSxcbiAgICBcImxheW91dFwiOiB7XG4gICAgICBcImljb24taW1hZ2VcIjogXCJkb3Quc2RmXCIsXG4gICAgICBcImljb24taWdub3JlLXBsYWNlbWVudFwiOiB0cnVlLFxuICAgICAgXCJpY29uLW1heC1zaXplXCI6IDEsXG4gICAgICBcImljb24tYWxsb3ctb3ZlcmxhcFwiOiB0cnVlXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwiaWNvbi1jb2xvclwiOiBcIiNmMWYwNzVcIixcbiAgICAgIFwiaWNvbi1zaXplXCI6IDJcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2x5Z29uc1wiLFxuICAgIFwidHlwZVwiOiBcImZpbGxcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvbHlnb25cIl1dLFxuICAgIFwicGFpbnRcIjoge1xuICAgICAgXCJmaWxsLWNvbG9yXCI6IFwiIzU2Yjg4MVwiLFxuICAgICAgXCJmaWxsLW91dGxpbmUtY29sb3JcIjogXCIjNTZiODgxXCIsXG4gICAgICBcImZpbGwtb3BhY2l0eVwiOiAwLjVcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1wb2x5Z29uLXN0cm9rZVwiLFxuICAgIFwidHlwZVwiOiBcImxpbmVcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIlBvbHlnb25cIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwibGluZS1jYXBcIjogXCJyb3VuZFwiLFxuICAgICAgXCJsaW5lLWpvaW5cIjogXCJyb3VuZFwiXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwibGluZS1jb2xvclwiOiBcIiM1NmI4ODFcIixcbiAgICAgIFwibGluZS13aWR0aFwiOiAyXG4gICAgfVxuICB9LCB7XG4gICAgXCJpZFwiOiBcImdsLWRyYXctbGluZVwiLFxuICAgIFwidHlwZVwiOiBcImxpbmVcIixcbiAgICBcInNvdXJjZVwiOiBcImRyYXdcIixcbiAgICBcImZpbHRlclwiOiBbXCJhbGxcIiwgW1wiPT1cIiwgXCIkdHlwZVwiLCBcIkxpbmVTdHJpbmdcIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwibGluZS1jYXBcIjogXCJyb3VuZFwiLFxuICAgICAgXCJsaW5lLWpvaW5cIjogXCJyb3VuZFwiXG4gICAgfSxcbiAgICBcInBhaW50XCI6IHtcbiAgICAgIFwibGluZS1jb2xvclwiOiBcIiM4YThhY2JcIixcbiAgICAgIFwibGluZS13aWR0aFwiOiA0XG4gICAgfVxuICB9XG5dO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBNZXJnZSB1c2VyIHByb3ZpZGVkIG9wdGlvbnMgb2JqZWN0IHdpdGggYSBkZWZhdWx0IG9uZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogQ29udGFpbmluZyBhbiBvcHRpb25zIGtleSB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gKiBAcGFyYW0ge29wdGlvbnN9IG9wdGlvbnMgUHJvdmlkZWQgb3B0aW9ucyB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5tb2R1bGUuZXhwb3J0cy5zZXRPcHRpb25zID0gZnVuY3Rpb24ob2JqLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJ29wdGlvbnMnKSkge1xuICAgICAgICBvYmoub3B0aW9ucyA9IG9iai5vcHRpb25zID8gT2JqZWN0LmNyZWF0ZShvYmoub3B0aW9ucykgOiB7fTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG4gICAgICAgIG9iai5vcHRpb25zW2ldID0gb3B0aW9uc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIG9iai5vcHRpb25zO1xufTtcblxubW9kdWxlLmV4cG9ydHMuRE9NID0ge307XG5cbi8qIEJ1aWxkcyBET00gZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFnIEVsZW1lbnQgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IFtjbGFzc05hbWVdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbnRhaW5lcl0gRE9NIGVsZW1lbnQgdG8gYXBwZW5kIHRvXG4gKiBAcGFyYW0ge09iamVjdH0gW2F0dHJidXRlc10gT2JqZWN0IGNvbnRhaW5pbmcgYXR0cmlidXRlcyB0byBhcHBseSB0byBhblxuICogZWxlbWVudC4gQXR0cmlidXRlIG5hbWUgY29ycmVzcG9uZHMgdG8gdGhlIGtleS5cbiAqIEByZXR1cm5zIHtlbH0gVGhlIGRvbSBlbGVtZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzLkRPTS5jcmVhdGUgPSBmdW5jdGlvbih0YWcsIGNsYXNzTmFtZSwgY29udGFpbmVyLCBhdHRyaWJ1dGVzKSB7XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAoYXR0cmlidXRlcykge1xuICAgIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbiAgfVxuICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuICByZXR1cm4gZWw7XG59O1xuXG4vKiBSZW1vdmVzIGNsYXNzZXMgZnJvbSBhbiBhcnJheSBvZiBET00gZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50c1xuICogQHBhcmFtIHtTdHJpbmd9IGtsYXNzXG4gKi9cbm1vZHVsZS5leHBvcnRzLkRPTS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1lbnRzLCBrbGFzcykge1xuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbihlbCkge1xuICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoa2xhc3MpO1xuICB9KTtcbn07XG5cbnZhciBkb2NTdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxuZnVuY3Rpb24gdGVzdFByb3AocHJvcHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChwcm9wc1tpXSBpbiBkb2NTdHlsZSkge1xuICAgICAgcmV0dXJuIHByb3BzW2ldO1xuICAgIH1cbiAgfVxufVxuXG52YXIgc2VsZWN0UHJvcCA9IHRlc3RQcm9wKFtcbiAgJ3VzZXJTZWxlY3QnLFxuICAnTW96VXNlclNlbGVjdCcsXG4gICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgJ21zVXNlclNlbGVjdCdcbl0pO1xuXG52YXIgdHJhbnNmb3JtUHJvcCA9IHRlc3RQcm9wKFtcbiAgJ3RyYW5zZm9ybScsXG4gICdXZWJraXRUcmFuc2Zvcm0nXG5dKTtcblxubW9kdWxlLmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24oZWwsIHZhbHVlKSB7XG4gIGVsLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdmFsdWU7XG59O1xuXG52YXIgdXNlclNlbGVjdDtcbm1vZHVsZS5leHBvcnRzLkRPTS5kaXNhYmxlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgdXNlclNlbGVjdCA9IGRvY1N0eWxlW3NlbGVjdFByb3BdO1xuICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gJ25vbmUnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5ET00uZW5hYmxlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgZG9jU3R5bGVbc2VsZWN0UHJvcF0gPSB1c2VyU2VsZWN0O1xuICB9XG59O1xuIl19
