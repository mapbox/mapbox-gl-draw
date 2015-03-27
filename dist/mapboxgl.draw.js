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

var extend = require('xtend');
var Control = require('./control');
var util = require('./util');
var DOM = util.DOM;

// Control handlers
var Shape = require('./handlers/shape');
var Line = require('./handlers/line');
var Circle = require('./handlers/circle');
var Square = require('./handlers/square');
var Marker = require('./handlers/marker');

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

    if (controls.shape) this._createButton(controlClass + ' shape', 'Shape tool', this._drawShape.bind(map));
    if (controls.line) this._createButton(controlClass + ' line', 'Line tool', this._drawLine.bind(map));
    if (controls.circle) this._createButton(controlClass + ' circle', 'Circle tool', this._drawCircle.bind(map));
    if (controls.square) this._createButton(controlClass + ' square', 'Rectangle tool', this._drawSquare.bind(map));
    if (controls.marker) this._createButton(controlClass + ' marker', 'Marker tool', this._drawMarker.bind(map));
    return container;
  },

  _drawShape: function() {
    new Shape(this);
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

  _drawMarker: function() {
    new Marker(this);
  },

  _createButton: function(className, title, fn) {
    var a = DOM.create('button', className, this._container, {
      title: title
    });

    var controlClass = this._controlClass;
    a.addEventListener('click', function(e) {
      e.preventDefault();

      if (!this.classList.contains('active')) {
        DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
        this.classList.add('active');
        fn();
      }
    });

    return a;
  }
});

},{"./control":"/Users/tristen/dev/mapbox/gl-draw/src/control.js","./handlers/circle":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/circle.js","./handlers/line":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/line.js","./handlers/marker":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/marker.js","./handlers/shape":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/shape.js","./handlers/square":"/Users/tristen/dev/mapbox/gl-draw/src/handlers/square.js","./util":"/Users/tristen/dev/mapbox/gl-draw/src/util.js","xtend":"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/circle.js":[function(require,module,exports){
'use strict';

module.exports = Circle;

function Circle(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/line.js":[function(require,module,exports){
'use strict';

module.exports = Line;

function Line(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/marker.js":[function(require,module,exports){
'use strict';

module.exports = Marker;

function Marker(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/shape.js":[function(require,module,exports){
'use strict';

module.exports = Shape;

function Shape(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/handlers/square.js":[function(require,module,exports){
'use strict';

module.exports = Square;

function Square(map) {
  console.log(map);
}

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/util.js":[function(require,module,exports){
'use strict';

module.exports = {

  /* Merge user provided options object with a default one
   *
   * @param {Object} obj Containing an options key with which to merge
   * @param {options} options Provided options with which to merge
   * @returns {Object}
   */
  setOptions: function(obj, options) {
      if (!obj.hasOwnProperty('options')) {
          obj.options = obj.options ? Object.create(obj.options) : {};
      }
      for (var i in options) {
          obj.options[i] = options[i];
      }
      return obj.options;
  },

  DOM: {
    /* Builds DOM elements
     *
     * @param {String} tag Element name
     * @param {String} [className]
     * @param {Object} [container] DOM element to append to
     * @param {Object} [attrbutes] Object containing attributes to apply to an
     * element. Attribute name corresponds to the key.
     * @returns {el} The dom element
     */
    create: function(tag, className, container, attributes) {
      var el = document.createElement(tag);
      if (className) el.className = className;
      if (attributes) {
        for (var key in attributes) {
          el.setAttribute(key, attributes[key]);
        }
      }
      if (container) container.appendChild(el);
      return el;
    },

    /* Removes classes from an array of DOM elements
     *
     * @param {HTMLElement} elements
     * @param {String} klass
     */
    removeClass: function(elements, klass) {
      Array.prototype.forEach.call(elements, function(el) {
        el.classList.remove(klass);
      });
    }
  }
};

},{}]},{},["/Users/tristen/dev/mapbox/gl-draw/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kcmF3LmpzIiwic3JjL2hhbmRsZXJzL2NpcmNsZS5qcyIsInNyYy9oYW5kbGVycy9saW5lLmpzIiwic3JjL2hhbmRsZXJzL21hcmtlci5qcyIsInNyYy9oYW5kbGVycy9zaGFwZS5qcyIsInNyYy9oYW5kbGVycy9zcXVhcmUuanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJgdXNlIHN0cmljdGA7XG5cbi8qKiBBIGRyYXdpbmcgY29tcG9uZW50IGZvciBtYXBib3hnbFxuICogQGNsYXNzIG1hcGJveC5EcmF3XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5wb3NpdGlvbj10b3AtcmlnaHRdIEEgc3RyaW5nIGluZGljYXRpbmcgdGhlIGNvbnRyb2wncyBwb3NpdGlvbiBvbiB0aGUgbWFwLiBPcHRpb25zIGFyZSBgdG9wcmlnaHRgLCBgdG9wbGVmdGAsIGBib3R0b21yaWdodGAsIGBib3R0b21sZWZ0YFxuICogQHJldHVybnMge0RyYXd9IGB0aGlzYFxuICogQGV4YW1wbGVcbiAqIHZhciBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAqICAgY29udGFpbmVyOiAnbWFwJyxcbiAqICAgc3R5bGU6ICdodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1zdHlsZXMvc3R5bGVzL291dGRvb3JzLXY3Lmpzb24nXG4gKiB9KTtcbiAqXG4gKiAvLyBJbml0aWFsaXplIHRoZSBkcmF3aW5nIGNvbXBvbmVudFxuICogbWFwLmFkZENvbnRyb2wobmV3IG1hcGJveGdsLkRyYXcoKSk7XG4gKi9cbm1hcGJveGdsLkRyYXcgPSByZXF1aXJlKCcuL3NyYy9kcmF3LmpzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgdmFyIHRhcmdldCA9IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBhZGRUbzogZnVuY3Rpb24obWFwKSB7XG4gICAgdGhpcy5fbWFwID0gbWFwO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSB0aGlzLm9uQWRkKG1hcCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgIHZhciBwb3MgPSB0aGlzLm9wdGlvbnMucG9zaXRpb247XG4gICAgICB2YXIgY29ybmVyID0gbWFwLl9jb250cm9sQ29ybmVyc1twb3NdO1xuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSArPSAnIG1hcGJveGdsLWN0cmwnO1xuXG4gICAgICBpZiAocG9zLmluZGV4T2YoJ2JvdHRvbScpICE9PSAtMSkge1xuICAgICAgICBjb3JuZXIuaW5zZXJ0QmVmb3JlKGNvbnRhaW5lciwgY29ybmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29ybmVyLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgIGlmICh0aGlzLm9uUmVtb3ZlKSB0aGlzLm9uUmVtb3ZlKHRoaXMuX21hcCk7XG4gICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJyk7XG52YXIgQ29udHJvbCA9IHJlcXVpcmUoJy4vY29udHJvbCcpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBET00gPSB1dGlsLkRPTTtcblxuLy8gQ29udHJvbCBoYW5kbGVyc1xudmFyIFNoYXBlID0gcmVxdWlyZSgnLi9oYW5kbGVycy9zaGFwZScpO1xudmFyIExpbmUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL2xpbmUnKTtcbnZhciBDaXJjbGUgPSByZXF1aXJlKCcuL2hhbmRsZXJzL2NpcmNsZScpO1xudmFyIFNxdWFyZSA9IHJlcXVpcmUoJy4vaGFuZGxlcnMvc3F1YXJlJyk7XG52YXIgTWFya2VyID0gcmVxdWlyZSgnLi9oYW5kbGVycy9tYXJrZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmF3O1xuXG5mdW5jdGlvbiBEcmF3KG9wdGlvbnMpIHtcbiAgdXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5EcmF3LnByb3RvdHlwZSA9IGV4dGVuZChDb250cm9sLCB7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcC1sZWZ0JyxcbiAgICBjb250cm9sczoge1xuICAgICAgbWFya2VyOiB0cnVlLFxuICAgICAgbGluZTogdHJ1ZSxcbiAgICAgIHNoYXBlOiB0cnVlLFxuICAgICAgc3F1YXJlOiB0cnVlLFxuICAgICAgY2lyY2xlOiB0cnVlXG4gICAgfVxuICB9LFxuXG4gIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgY29udHJvbENsYXNzID0gdGhpcy5fY29udHJvbENsYXNzID0gJ21hcGJveGdsLWN0cmwtZHJhdy1idG4nO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwYm94Z2wtY3RybC1ncm91cCcsIG1hcC5nZXRDb250YWluZXIoKSk7XG4gICAgdmFyIGNvbnRyb2xzID0gdGhpcy5vcHRpb25zLmNvbnRyb2xzO1xuXG4gICAgaWYgKGNvbnRyb2xzLnNoYXBlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBzaGFwZScsICdTaGFwZSB0b29sJywgdGhpcy5fZHJhd1NoYXBlLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLmxpbmUpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIGxpbmUnLCAnTGluZSB0b29sJywgdGhpcy5fZHJhd0xpbmUuYmluZChtYXApKTtcbiAgICBpZiAoY29udHJvbHMuY2lyY2xlKSB0aGlzLl9jcmVhdGVCdXR0b24oY29udHJvbENsYXNzICsgJyBjaXJjbGUnLCAnQ2lyY2xlIHRvb2wnLCB0aGlzLl9kcmF3Q2lyY2xlLmJpbmQobWFwKSk7XG4gICAgaWYgKGNvbnRyb2xzLnNxdWFyZSkgdGhpcy5fY3JlYXRlQnV0dG9uKGNvbnRyb2xDbGFzcyArICcgc3F1YXJlJywgJ1JlY3RhbmdsZSB0b29sJywgdGhpcy5fZHJhd1NxdWFyZS5iaW5kKG1hcCkpO1xuICAgIGlmIChjb250cm9scy5tYXJrZXIpIHRoaXMuX2NyZWF0ZUJ1dHRvbihjb250cm9sQ2xhc3MgKyAnIG1hcmtlcicsICdNYXJrZXIgdG9vbCcsIHRoaXMuX2RyYXdNYXJrZXIuYmluZChtYXApKTtcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9LFxuXG4gIF9kcmF3U2hhcGU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBTaGFwZSh0aGlzKTtcbiAgfSxcblxuICBfZHJhd0xpbmU6IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBMaW5lKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3Q2lyY2xlOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgQ2lyY2xlKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3U3F1YXJlOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgU3F1YXJlKHRoaXMpO1xuICB9LFxuXG4gIF9kcmF3TWFya2VyOiBmdW5jdGlvbigpIHtcbiAgICBuZXcgTWFya2VyKHRoaXMpO1xuICB9LFxuXG4gIF9jcmVhdGVCdXR0b246IGZ1bmN0aW9uKGNsYXNzTmFtZSwgdGl0bGUsIGZuKSB7XG4gICAgdmFyIGEgPSBET00uY3JlYXRlKCdidXR0b24nLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lciwge1xuICAgICAgdGl0bGU6IHRpdGxlXG4gICAgfSk7XG5cbiAgICB2YXIgY29udHJvbENsYXNzID0gdGhpcy5fY29udHJvbENsYXNzO1xuICAgIGEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICghdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgICAgIERPTS5yZW1vdmVDbGFzcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbnRyb2xDbGFzcyksICdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgZm4oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBhO1xuICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBDaXJjbGU7XG5cbmZ1bmN0aW9uIENpcmNsZShtYXApIHtcbiAgY29uc29sZS5sb2cobWFwKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBMaW5lO1xuXG5mdW5jdGlvbiBMaW5lKG1hcCkge1xuICBjb25zb2xlLmxvZyhtYXApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtlcjtcblxuZnVuY3Rpb24gTWFya2VyKG1hcCkge1xuICBjb25zb2xlLmxvZyhtYXApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNoYXBlO1xuXG5mdW5jdGlvbiBTaGFwZShtYXApIHtcbiAgY29uc29sZS5sb2cobWFwKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBTcXVhcmU7XG5cbmZ1bmN0aW9uIFNxdWFyZShtYXApIHtcbiAgY29uc29sZS5sb2cobWFwKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyogTWVyZ2UgdXNlciBwcm92aWRlZCBvcHRpb25zIG9iamVjdCB3aXRoIGEgZGVmYXVsdCBvbmVcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBDb250YWluaW5nIGFuIG9wdGlvbnMga2V5IHdpdGggd2hpY2ggdG8gbWVyZ2VcbiAgICogQHBhcmFtIHtvcHRpb25zfSBvcHRpb25zIFByb3ZpZGVkIG9wdGlvbnMgd2l0aCB3aGljaCB0byBtZXJnZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgc2V0T3B0aW9uczogZnVuY3Rpb24ob2JqLCBvcHRpb25zKSB7XG4gICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eSgnb3B0aW9ucycpKSB7XG4gICAgICAgICAgb2JqLm9wdGlvbnMgPSBvYmoub3B0aW9ucyA/IE9iamVjdC5jcmVhdGUob2JqLm9wdGlvbnMpIDoge307XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICBvYmoub3B0aW9uc1tpXSA9IG9wdGlvbnNbaV07XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqLm9wdGlvbnM7XG4gIH0sXG5cbiAgRE9NOiB7XG4gICAgLyogQnVpbGRzIERPTSBlbGVtZW50c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhZyBFbGVtZW50IG5hbWVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2NsYXNzTmFtZV1cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRhaW5lcl0gRE9NIGVsZW1lbnQgdG8gYXBwZW5kIHRvXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFthdHRyYnV0ZXNdIE9iamVjdCBjb250YWluaW5nIGF0dHJpYnV0ZXMgdG8gYXBwbHkgdG8gYW5cbiAgICAgKiBlbGVtZW50LiBBdHRyaWJ1dGUgbmFtZSBjb3JyZXNwb25kcyB0byB0aGUga2V5LlxuICAgICAqIEByZXR1cm5zIHtlbH0gVGhlIGRvbSBlbGVtZW50XG4gICAgICovXG4gICAgY3JlYXRlOiBmdW5jdGlvbih0YWcsIGNsYXNzTmFtZSwgY29udGFpbmVyLCBhdHRyaWJ1dGVzKSB7XG4gICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChjb250YWluZXIpIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XG4gICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIC8qIFJlbW92ZXMgY2xhc3NlcyBmcm9tIGFuIGFycmF5IG9mIERPTSBlbGVtZW50c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudHNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2xhc3NcbiAgICAgKi9cbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24oZWxlbWVudHMsIGtsYXNzKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbihlbCkge1xuICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGtsYXNzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==
