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
      container.className += ' mapboxgl-ctrl';

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
var util = require('./util');
var theme = require('./theme');
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

module.exports = Line;

function Line(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/point.js":[function(require,module,exports){
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

module.exports = Polygon;

function Polygon(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/square.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kcmF3LmpzIiwic3JjL2hhbmRsZXJzL2NpcmNsZS5qcyIsInNyYy9oYW5kbGVycy9oYW5kbGVycy5qcyIsInNyYy9oYW5kbGVycy9saW5lLmpzIiwic3JjL2hhbmRsZXJzL3BvaW50LmpzIiwic3JjL2hhbmRsZXJzL3BvbHlnb24uanMiLCJzcmMvaGFuZGxlcnMvc3F1YXJlLmpzIiwic3JjL3N0b3JlLmpzIiwic3JjL3RoZW1lLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImB1c2Ugc3RyaWN0YDtcblxuLyoqIEEgZHJhd2luZyBjb21wb25lbnQgZm9yIG1hcGJveGdsXG4gKiBAY2xhc3MgbWFwYm94LkRyYXdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLnBvc2l0aW9uPXRvcC1yaWdodF0gQSBzdHJpbmcgaW5kaWNhdGluZyB0aGUgY29udHJvbCdzIHBvc2l0aW9uIG9uIHRoZSBtYXAuIE9wdGlvbnMgYXJlIGB0b3ByaWdodGAsIGB0b3BsZWZ0YCwgYGJvdHRvbXJpZ2h0YCwgYGJvdHRvbWxlZnRgXG4gKiBAcmV0dXJucyB7RHJhd30gYHRoaXNgXG4gKiBAZXhhbXBsZVxuICogdmFyIG1hcCA9IG5ldyBtYXBib3hnbC5NYXAoe1xuICogICBjb250YWluZXI6ICdtYXAnLFxuICogICBzdHlsZTogJ2h0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LWdsLXN0eWxlcy9zdHlsZXMvb3V0ZG9vcnMtdjcuanNvbidcbiAqIH0pO1xuICpcbiAqIC8vIEluaXRpYWxpemUgdGhlIGRyYXdpbmcgY29tcG9uZW50XG4gKiBtYXAuYWRkQ29udHJvbChuZXcgbWFwYm94Z2wuRHJhdygpKTtcbiAqL1xubWFwYm94Z2wuRHJhdyA9IHJlcXVpcmUoJy4vc3JjL2RyYXcuanMnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGFkZFRvOiBmdW5jdGlvbihtYXApIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lciA9IHRoaXMub25BZGQobWFwKTtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5wb3NpdGlvbikge1xuICAgICAgdmFyIHBvcyA9IHRoaXMub3B0aW9ucy5wb3NpdGlvbjtcbiAgICAgIHZhciBjb3JuZXIgPSBtYXAuX2NvbnRyb2xDb3JuZXJzW3Bvc107XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgbWFwYm94Z2wtY3RybCc7XG5cbiAgICAgIGlmIChwb3MuaW5kZXhPZignYm90dG9tJykgIT09IC0xKSB7XG4gICAgICAgIGNvcm5lci5pbnNlcnRCZWZvcmUoY29udGFpbmVyLCBjb3JuZXIuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb3JuZXIuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgaWYgKHRoaXMub25SZW1vdmUpIHRoaXMub25SZW1vdmUodGhpcy5fbWFwKTtcbiAgICB0aGlzLl9tYXAgPSBudWxsO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBnbG9iYWwgbWFwYm94Z2wgKi9cblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJyk7XG52YXIgQ29udHJvbCA9IHJlcXVpcmUoJy4vY29udHJvbCcpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcbnZhciBET00gPSB1dGlsLkRPTTtcblxuLy8gQ29udHJvbCBoYW5kbGVyc1xudmFyIFBvbHlnb24gPSByZXF1aXJlKCcuL2hhbmRsZXJzL3BvbHlnb24nKTtcbnZhciBMaW5lID0gcmVxdWlyZSgnLi9oYW5kbGVycy9saW5lJyk7XG52YXIgQ2lyY2xlID0gcmVxdWlyZSgnLi9oYW5kbGVycy9jaXJjbGUnKTtcbnZhciBTcXVhcmUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL3NxdWFyZScpO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9oYW5kbGVycy9wb2ludCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYXc7XG5cbmZ1bmN0aW9uIERyYXcob3B0aW9ucykge1xuICB1dGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG59XG5cbkRyYXcucHJvdG90eXBlID0gZXh0ZW5kKENvbnRyb2wsIHtcbiAgb3B0aW9uczoge1xuICAgIHBvc2l0aW9uOiAndG9wLWxlZnQnLFxuICAgIGNvbnRyb2xzOiB7XG4gICAgICBtYXJrZXI6IHRydWUsXG4gICAgICBsaW5lOiB0cnVlLFxuICAgICAgc2hhcGU6IHRydWUsXG4gICAgICBzcXVhcmU6IHRydWUsXG4gICAgICBjaXJjbGU6IHRydWVcbiAgICB9XG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBjb250cm9sQ2xhc3MgPSB0aGlzLl9jb250cm9sQ2xhc3MgPSAnbWFwYm94Z2wtY3RybC1kcmF3LWJ0bic7XG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXBib3hnbC1jdHJsLWdyb3VwJywgbWFwLmdldENvbnRhaW5lcigpKTtcbiAgICB2YXIgY29udHJvbHMgPSB0aGlzLm9wdGlvbnMuY29udHJvbHM7XG5cbiAgICBpZiAoY29udHJvbHMuc2hhcGUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIHNoYXBlJywgJ1NoYXBlIHRvb2wnLCB0aGlzLl9kcmF3UG9seWdvbi5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5saW5lKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBsaW5lJywgJ0xpbmUgdG9vbCcsIHRoaXMuX2RyYXdMaW5lLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLmNpcmNsZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgY2lyY2xlJywgJ0NpcmNsZSB0b29sJywgdGhpcy5fZHJhd0NpcmNsZS5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5zcXVhcmUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIHNxdWFyZScsICdSZWN0YW5nbGUgdG9vbCcsIHRoaXMuX2RyYXdTcXVhcmUuYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMubWFya2VyKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBtYXJrZXInLCAnTWFya2VyIHRvb2wnLCB0aGlzLl9kcmF3UG9pbnQuYmluZChtYXApKTtcblxuICAgIHRoaXMuX21hcFN0YXRlKG1hcCk7XG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgfSxcblxuICBfZHJhd1BvbHlnb246IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBQb2x5Z29uKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3TGluZTogZnVuY3Rpb24oKSB7XG4gICAgbmV3IExpbmUodGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdDaXJjbGU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBDaXJjbGUodGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdTcXVhcmU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBTcXVhcmUodGhpcyk7XG4gIH0sXG5cbiAgX2RyYXdQb2ludDogZnVuY3Rpb24oKSB7XG4gICAgbmV3IFBvaW50KHRoaXMpO1xuICB9LFxuXG4gIF9jcmVhdGVCdXR0b246IGZ1bmN0aW9uKGNsYXNzTmFtZSwgdGl0bGUsIGZuKSB7XG4gICAgdmFyIGEgPSBET00uY3JlYXRlKCdidXR0b24nLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lciwge1xuICAgICAgdGl0bGU6IHRpdGxlXG4gICAgfSk7XG5cbiAgICB2YXIgY29udHJvbENsYXNzID0gdGhpcy5fY29udHJvbENsYXNzO1xuXG4gICAgYS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKHRoaXMuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgRE9NLnJlbW92ZUNsYXNzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29udHJvbENsYXNzKSwgJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICBmbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGE7XG4gIH0sXG5cbiAgX21hcFN0YXRlOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgZHJhd0xheWVyO1xuXG4gICAgbWFwLm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgIG1hcC5vbignZHJhdy5mZWF0dXJlLmNyZWF0ZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkcmF3TGF5ZXIpIHtcbiAgICAgICAgICBkcmF3TGF5ZXIuc2V0RGF0YShlLmdlb2pzb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRyYXdMYXllciA9IG5ldyBtYXBib3hnbC5HZW9KU09OU291cmNlKHtcbiAgICAgICAgICAgIGRhdGE6IGUuZ2VvanNvblxuICAgICAgICAgIH0pO1xuICAgICAgICAgIG1hcC5hZGRTb3VyY2UoJ2RyYXcnLCBkcmF3TGF5ZXIpO1xuXG4gICAgICAgICAgdGhlbWUuZm9yRWFjaChmdW5jdGlvbihzdHlsZSkge1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKHN0eWxlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2lyY2xlO1xuXG5mdW5jdGlvbiBDaXJjbGUobWFwKSB7XG4gIGNvbnNvbGUubG9nKG1hcCk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24obWFwLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5fbWFwID0gbWFwO1xuXHRcdHRoaXMuX2NvbnRhaW5lciA9IG1hcC5nZXRDb250YWluZXIoKTtcblx0XHR1dGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5lbmFibGUoKTtcblx0fSxcblxuXHRlbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtYXAgPSB0aGlzLl9tYXA7XG5cdFx0aWYgKG1hcCkge1xuXHRcdFx0dXRpbC5ET00uZGlzYWJsZVNlbGVjdGlvbigpO1xuXHRcdFx0bWFwLmdldENvbnRhaW5lcigpLmZvY3VzKCk7XG4gICAgICB0aGlzLl9jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9jYW5jZWxEcmF3aW5nLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ21hcGJveGdsLWRyYXctYWN0aXZhdGVkJyk7XG4gICAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5zdGFydCcsIHsgZmVhdHVyZVR5cGU6IHRoaXMudHlwZSB9KTtcbiAgICAgIHRoaXMuZHJhd1N0YXJ0KCk7XG5cdFx0fVxuXHR9LFxuXG5cdGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9tYXApIHtcblx0XHRcdHV0aWwuRE9NLmVuYWJsZVNlbGVjdGlvbigpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fY2FuY2VsRHJhd2luZy5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdtYXBib3hnbC1kcmF3LWFjdGl2YXRlZCcpO1xuICAgICAgdGhpcy5fbWFwLmZpcmUoJ2RyYXcuc3RvcCcsIHsgZmVhdHVyZVR5cGU6IHRoaXMudHlwZSB9KTtcbiAgICAgIHRoaXMuZHJhd1N0b3AoKTtcblx0XHR9XG5cdH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbih0eXBlLCBjb29yZGluYXRlcykge1xuICAgIHZhciBmZWF0dXJlID0gc3RvcmUuc2V0KHR5cGUsIGNvb3JkaW5hdGVzKTtcbiAgICB0aGlzLl9tYXAuZmlyZSgnZHJhdy5mZWF0dXJlLmNyZWF0ZWQnLCB7Z2VvanNvbjogc3RvcmUuZ2V0QWxsKCl9KTtcblx0XHR0aGlzLl9jcmVhdGVkKGZlYXR1cmUpO1xuXHRcdGlmICghdGhpcy5vcHRpb25zLnJlcGVhdE1vZGUpIHRoaXMuZGlzYWJsZSgpO1xuICB9LFxuXG5cdF9jcmVhdGVkOiBmdW5jdGlvbihmZWF0dXJlKSB7XG5cdFx0dGhpcy5fbWFwLmZpcmUoJ2RyYXcuY3JlYXRlZCcsIHtcbiAgICAgIGZlYXR1cmVUeXBlOiB0aGlzLnR5cGUsXG4gICAgICBmZWF0dXJlOiBmZWF0dXJlXG4gICAgfSk7XG5cdH0sXG5cblx0X2NhbmNlbERyYXdpbmc6IGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoZS5rZXlDb2RlID09PSAyNykgeyAvLyBlc2Ncblx0XHRcdHRoaXMuZGlzYWJsZSgpO1xuXHRcdH1cblx0fVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBMaW5lO1xuXG5mdW5jdGlvbiBMaW5lKG1hcCkge1xuICBjb25zb2xlLmxvZyhtYXApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBIYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDtcblxuZnVuY3Rpb24gUG9pbnQobWFwKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIHJlcGVhdE1vZGU6IHRydWVcbiAgfTtcblxuICB0aGlzLnR5cGUgPSAnUG9pbnQnO1xuICB0aGlzLmluaXRpYWxpemUobWFwLCBvcHRpb25zKTtcbn1cblxuUG9pbnQucHJvdG90eXBlID0gZXh0ZW5kKEhhbmRsZXJzLCB7XG5cblx0ZHJhd1N0YXJ0OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl9tYXAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9vbkNsaWNrKGUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR9XG5cdH0sXG5cblx0ZHJhd1N0b3A6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9tYXApIHtcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2NsaWNrJywgdGhpcy5fb25DbGljayk7XG5cdFx0fVxuXHR9LFxuXG5cdF9vbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGMgPSB0aGlzLl9tYXAudW5wcm9qZWN0KFtlLnBvaW50LngsIGUucG9pbnQueV0pO1xuICAgIHZhciBwb2ludCA9IFtjLmxuZywgYy5sYXRdO1xuICAgIHRoaXMuY3JlYXRlKHRoaXMudHlwZSwgcG9pbnQpO1xuXHR9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlnb247XG5cbmZ1bmN0aW9uIFBvbHlnb24obWFwKSB7XG4gIGNvbnNvbGUubG9nKG1hcCk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gU3F1YXJlO1xuXG5mdW5jdGlvbiBTcXVhcmUobWFwKSB7XG4gIGNvbnNvbGUubG9nKG1hcCk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGdldEFsbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gIH0sXG5cbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPIGdldCBhIHNwZWNpZmljIGdlb2pzb24gb2JqZWN0XG4gIH0sXG5cbiAgdW5zZXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE8gdW5kbyBtYW5hZ2VtZW50LlxuICAgIHRoaXMuX2hpc3RvcnkgPSB0aGlzLmdldEFsbCgpLmZlYXR1cmVzO1xuICAgIC8vIFRPRE8gcmVtb3ZlIGEgc3BlY2lmaWMgZ2VvanNvbiBvYmplY3RcbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKHR5cGUsIGNvb3JkaW5hdGVzKSB7XG5cbiAgICB2YXIgb2JqID0ge1xuICAgICAgdHlwZTogJ0ZlYXR1cmUnLFxuICAgICAgcHJvcGVydGllczoge30sXG4gICAgICBnZW9tZXRyeToge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBjb29yZGluYXRlczogY29vcmRpbmF0ZXNcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5fZGF0YS5mZWF0dXJlcy5wdXNoKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICBfZGF0YToge1xuICAgIHR5cGU6ICdGZWF0dXJlQ29sbGVjdGlvbicsXG4gICAgZmVhdHVyZXM6IFtdXG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAge1xuICAgIFwiaWRcIjogXCJnbC1kcmF3LXBvaW50c1wiLFxuICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgIFwic291cmNlXCI6IFwiZHJhd1wiLFxuICAgIFwiZmlsdGVyXCI6IFtcImFsbFwiLCBbXCI9PVwiLCBcIiR0eXBlXCIsIFwiUG9pbnRcIl1dLFxuICAgIFwibGF5b3V0XCI6IHtcbiAgICAgIFwiaWNvbi1pbWFnZVwiOiBcImRvdC5zZGZcIixcbiAgICAgIFwiaWNvbi1pZ25vcmUtcGxhY2VtZW50XCI6IHRydWUsXG4gICAgICBcImljb24tbWF4LXNpemVcIjogMSxcbiAgICAgIFwiaWNvbi1hbGxvdy1vdmVybGFwXCI6IHRydWVcbiAgICB9LFxuICAgIFwicGFpbnRcIjoge1xuICAgICAgXCJpY29uLWNvbG9yXCI6IFwiI2YxZjA3NVwiLFxuICAgICAgXCJpY29uLXNpemVcIjogMlxuICAgIH1cbiAgfSwge1xuICAgIFwiaWRcIjogXCJnbC1kcmF3LXBvbHlnb25zXCIsXG4gICAgXCJ0eXBlXCI6IFwiZmlsbFwiLFxuICAgIFwic291cmNlXCI6IFwiZHJhd1wiLFxuICAgIFwiZmlsdGVyXCI6IFtcImFsbFwiLCBbXCI9PVwiLCBcIiR0eXBlXCIsIFwiUG9seWdvblwiXV0sXG4gICAgXCJwYWludFwiOiB7XG4gICAgICBcImZpbGwtY29sb3JcIjogXCIjNTZiODgxXCIsXG4gICAgICBcImZpbGwtb3V0bGluZS1jb2xvclwiOiBcIiM1NmI4ODFcIixcbiAgICAgIFwiZmlsbC1vcGFjaXR5XCI6IDAuNVxuICAgIH1cbiAgfSwge1xuICAgIFwiaWRcIjogXCJnbC1kcmF3LXBvbHlnb24tc3Ryb2tlXCIsXG4gICAgXCJ0eXBlXCI6IFwibGluZVwiLFxuICAgIFwic291cmNlXCI6IFwiZHJhd1wiLFxuICAgIFwiZmlsdGVyXCI6IFtcImFsbFwiLCBbXCI9PVwiLCBcIiR0eXBlXCIsIFwiUG9seWdvblwiXV0sXG4gICAgXCJsYXlvdXRcIjoge1xuICAgICAgXCJsaW5lLWNhcFwiOiBcInJvdW5kXCIsXG4gICAgICBcImxpbmUtam9pblwiOiBcInJvdW5kXCJcbiAgICB9LFxuICAgIFwicGFpbnRcIjoge1xuICAgICAgXCJsaW5lLWNvbG9yXCI6IFwiIzU2Yjg4MVwiLFxuICAgICAgXCJsaW5lLXdpZHRoXCI6IDJcbiAgICB9XG4gIH0sIHtcbiAgICBcImlkXCI6IFwiZ2wtZHJhdy1saW5lXCIsXG4gICAgXCJ0eXBlXCI6IFwibGluZVwiLFxuICAgIFwic291cmNlXCI6IFwiZHJhd1wiLFxuICAgIFwiZmlsdGVyXCI6IFtcImFsbFwiLCBbXCI9PVwiLCBcIiR0eXBlXCIsIFwiTGluZVN0cmluZ1wiXV0sXG4gICAgXCJsYXlvdXRcIjoge1xuICAgICAgXCJsaW5lLWNhcFwiOiBcInJvdW5kXCIsXG4gICAgICBcImxpbmUtam9pblwiOiBcInJvdW5kXCJcbiAgICB9LFxuICAgIFwicGFpbnRcIjoge1xuICAgICAgXCJsaW5lLWNvbG9yXCI6IFwiIzhhOGFjYlwiLFxuICAgICAgXCJsaW5lLXdpZHRoXCI6IDRcbiAgICB9XG4gIH1cbl07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIE1lcmdlIHVzZXIgcHJvdmlkZWQgb3B0aW9ucyBvYmplY3Qgd2l0aCBhIGRlZmF1bHQgb25lXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBDb250YWluaW5nIGFuIG9wdGlvbnMga2V5IHdpdGggd2hpY2ggdG8gbWVyZ2VcbiAqIEBwYXJhbSB7b3B0aW9uc30gb3B0aW9ucyBQcm92aWRlZCBvcHRpb25zIHdpdGggd2hpY2ggdG8gbWVyZ2VcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzLnNldE9wdGlvbnMgPSBmdW5jdGlvbihvYmosIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eSgnb3B0aW9ucycpKSB7XG4gICAgICAgIG9iai5vcHRpb25zID0gb2JqLm9wdGlvbnMgPyBPYmplY3QuY3JlYXRlKG9iai5vcHRpb25zKSA6IHt9O1xuICAgIH1cbiAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcbiAgICAgICAgb2JqLm9wdGlvbnNbaV0gPSBvcHRpb25zW2ldO1xuICAgIH1cbiAgICByZXR1cm4gb2JqLm9wdGlvbnM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5ET00gPSB7fTtcblxuLyogQnVpbGRzIERPTSBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0YWcgRWxlbWVudCBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gW2NsYXNzTmFtZV1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGFpbmVyXSBET00gZWxlbWVudCB0byBhcHBlbmQgdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBbYXR0cmJ1dGVzXSBPYmplY3QgY29udGFpbmluZyBhdHRyaWJ1dGVzIHRvIGFwcGx5IHRvIGFuXG4gKiBlbGVtZW50LiBBdHRyaWJ1dGUgbmFtZSBjb3JyZXNwb25kcyB0byB0aGUga2V5LlxuICogQHJldHVybnMge2VsfSBUaGUgZG9tIGVsZW1lbnRcbiAqL1xubW9kdWxlLmV4cG9ydHMuRE9NLmNyZWF0ZSA9IGZ1bmN0aW9uKHRhZywgY2xhc3NOYW1lLCBjb250YWluZXIsIGF0dHJpYnV0ZXMpIHtcbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxuICB9XG4gIGlmIChjb250YWluZXIpIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XG4gIHJldHVybiBlbDtcbn07XG5cbi8qIFJlbW92ZXMgY2xhc3NlcyBmcm9tIGFuIGFycmF5IG9mIERPTSBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRzXG4gKiBAcGFyYW0ge1N0cmluZ30ga2xhc3NcbiAqL1xubW9kdWxlLmV4cG9ydHMuRE9NLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWxlbWVudHMsIGtsYXNzKSB7XG4gIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxlbWVudHMsIGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuY2xhc3NMaXN0LnJlbW92ZShrbGFzcyk7XG4gIH0pO1xufTtcblxudmFyIGRvY1N0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xuXG5mdW5jdGlvbiB0ZXN0UHJvcChwcm9wcykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByb3BzW2ldIGluIGRvY1N0eWxlKSB7XG4gICAgICByZXR1cm4gcHJvcHNbaV07XG4gICAgfVxuICB9XG59XG5cbnZhciBzZWxlY3RQcm9wID0gdGVzdFByb3AoW1xuICAndXNlclNlbGVjdCcsXG4gICdNb3pVc2VyU2VsZWN0JyxcbiAgJ1dlYmtpdFVzZXJTZWxlY3QnLFxuICAnbXNVc2VyU2VsZWN0J1xuXSk7XG5cbnZhciB1c2VyU2VsZWN0O1xuXG5tb2R1bGUuZXhwb3J0cy5ET00uZGlzYWJsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoc2VsZWN0UHJvcCkge1xuICAgIHVzZXJTZWxlY3QgPSBkb2NTdHlsZVtzZWxlY3RQcm9wXTtcbiAgICBkb2NTdHlsZVtzZWxlY3RQcm9wXSA9ICdub25lJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMuRE9NLmVuYWJsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoc2VsZWN0UHJvcCkge1xuICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gdXNlclNlbGVjdDtcbiAgfVxufTtcbiJdfQ==
