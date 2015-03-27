(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/tristen/dev/mapbox/gl-draw/index.js":[function(require,module,exports){
`use strict`;

/** A drawing component for mapboxgl
 * @class mapbox.Draw
 *
 * @param {Object} options
 * @param {String} [options.position=topright] A string indicating the control's position on the map. Options are `topright`, `topleft`, `bottomright`, `bottomleft`
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

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/dom.js":[function(require,module,exports){
'use strict';

/* Builds DOM elements
 * @param {String} tag Element name
 * @param {String} [className]
 * @param {Object} [container] DOM element to append to
 * @param {Object} [attrbutes] Object containing attributes to apply to an
 * element. Attribute name corresponds to the key.
 * @returns {el} The dom element
 */
module.exports.create = function(tag, className, container, attributes) {
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

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/draw.js":[function(require,module,exports){
'use strict';

var extend = require('xtend');
var Control = require('./control');
var DOM = require('./dom');
var util = require('./util');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = extend(Control, {
  options: {
    position: 'top-left'
  },

  onAdd: function(map) {
    var className = 'mapboxgl-ctrl';
    var container = this._container = DOM.create('div', className + '-group', map.getContainer());
    this._shapeButton = this._createButton('mapboxgl-ctrl-draw-btn shape', 'Shape tool', this._drawShape.bind(map));
    this._lineButton = this._createButton('mapboxgl-ctrl-draw-btn line', 'Line tool', this._drawLine.bind(map));
    this._circleButton = this._createButton('mapboxgl-ctrl-draw-btn circle', 'Circle tool', this._drawCircle.bind(map));
    this._squareButton = this._createButton('mapboxgl-ctrl-draw-btn square', 'Rectangle tool', this._drawSquare.bind(map));
    this._markerButton = this._createButton('mapboxgl-ctrl-draw-btn marker', 'Marker tool', this._drawMarker.bind(map));
    return container;
  },

  _drawShape: function(map) {},
  _drawLine: function(map) {},
  _drawCircle: function(map) {},
  _drawSquare: function(map) {},
  _drawMarker: function(map) {},

  _createButton: function(className, title, fn) {
    var a = DOM.create('button', className, this._container, {title: title});
    a.addEventListener('click', function() { fn(); });
    return a;
  }
});

},{"./control":"/Users/tristen/dev/mapbox/gl-draw/src/control.js","./dom":"/Users/tristen/dev/mapbox/gl-draw/src/dom.js","./util":"/Users/tristen/dev/mapbox/gl-draw/src/util.js","xtend":"/Users/tristen/dev/mapbox/gl-draw/node_modules/xtend/immutable.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/util.js":[function(require,module,exports){
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
  }
};

},{}]},{},["/Users/tristen/dev/mapbox/gl-draw/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJzcmMvY29udHJvbC5qcyIsInNyYy9kb20uanMiLCJzcmMvZHJhdy5qcyIsInNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYHVzZSBzdHJpY3RgO1xuXG4vKiogQSBkcmF3aW5nIGNvbXBvbmVudCBmb3IgbWFwYm94Z2xcbiAqIEBjbGFzcyBtYXBib3guRHJhd1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge1N0cmluZ30gW29wdGlvbnMucG9zaXRpb249dG9wcmlnaHRdIEEgc3RyaW5nIGluZGljYXRpbmcgdGhlIGNvbnRyb2wncyBwb3NpdGlvbiBvbiB0aGUgbWFwLiBPcHRpb25zIGFyZSBgdG9wcmlnaHRgLCBgdG9wbGVmdGAsIGBib3R0b21yaWdodGAsIGBib3R0b21sZWZ0YFxuICogQHJldHVybnMge0RyYXd9IGB0aGlzYFxuICogQGV4YW1wbGVcbiAqIHZhciBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAqICAgY29udGFpbmVyOiAnbWFwJyxcbiAqICAgc3R5bGU6ICdodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1zdHlsZXMvc3R5bGVzL291dGRvb3JzLXY3Lmpzb24nXG4gKiB9KTtcbiAqXG4gKiAvLyBJbml0aWFsaXplIHRoZSBkcmF3aW5nIGNvbXBvbmVudFxuICogbWFwLmFkZENvbnRyb2wobmV3IG1hcGJveGdsLkRyYXcoKSk7XG4gKi9cbm1hcGJveGdsLkRyYXcgPSByZXF1aXJlKCcuL3NyYy9kcmF3LmpzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgdmFyIHRhcmdldCA9IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBhZGRUbzogZnVuY3Rpb24obWFwKSB7XG4gICAgdGhpcy5fbWFwID0gbWFwO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSB0aGlzLm9uQWRkKG1hcCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgIHZhciBwb3MgPSB0aGlzLm9wdGlvbnMucG9zaXRpb247XG4gICAgICB2YXIgY29ybmVyID0gbWFwLl9jb250cm9sQ29ybmVyc1twb3NdO1xuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSArPSAnIG1hcGJveGdsLWN0cmwnO1xuXG4gICAgICBpZiAocG9zLmluZGV4T2YoJ2JvdHRvbScpICE9PSAtMSkge1xuICAgICAgICBjb3JuZXIuaW5zZXJ0QmVmb3JlKGNvbnRhaW5lciwgY29ybmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29ybmVyLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgIGlmICh0aGlzLm9uUmVtb3ZlKSB0aGlzLm9uUmVtb3ZlKHRoaXMuX21hcCk7XG4gICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogQnVpbGRzIERPTSBlbGVtZW50c1xuICogQHBhcmFtIHtTdHJpbmd9IHRhZyBFbGVtZW50IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBbY2xhc3NOYW1lXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb250YWluZXJdIERPTSBlbGVtZW50IHRvIGFwcGVuZCB0b1xuICogQHBhcmFtIHtPYmplY3R9IFthdHRyYnV0ZXNdIE9iamVjdCBjb250YWluaW5nIGF0dHJpYnV0ZXMgdG8gYXBwbHkgdG8gYW5cbiAqIGVsZW1lbnQuIEF0dHJpYnV0ZSBuYW1lIGNvcnJlc3BvbmRzIHRvIHRoZSBrZXkuXG4gKiBAcmV0dXJucyB7ZWx9IFRoZSBkb20gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbih0YWcsIGNsYXNzTmFtZSwgY29udGFpbmVyLCBhdHRyaWJ1dGVzKSB7XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAoYXR0cmlidXRlcykge1xuICAgIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbiAgfVxuICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuICByZXR1cm4gZWw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG52YXIgRE9NID0gcmVxdWlyZSgnLi9kb20nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhdztcblxuZnVuY3Rpb24gRHJhdyhvcHRpb25zKSB7XG4gIHV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbn1cblxuRHJhdy5wcm90b3R5cGUgPSBleHRlbmQoQ29udHJvbCwge1xuICBvcHRpb25zOiB7XG4gICAgcG9zaXRpb246ICd0b3AtbGVmdCdcbiAgfSxcblxuICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9ICdtYXBib3hnbC1jdHJsJztcbiAgICB2YXIgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgY2xhc3NOYW1lICsgJy1ncm91cCcsIG1hcC5nZXRDb250YWluZXIoKSk7XG4gICAgdGhpcy5fc2hhcGVCdXR0b24gPSB0aGlzLl9jcmVhdGVCdXR0b24oJ21hcGJveGdsLWN0cmwtZHJhdy1idG4gc2hhcGUnLCAnU2hhcGUgdG9vbCcsIHRoaXMuX2RyYXdTaGFwZS5iaW5kKG1hcCkpO1xuICAgIHRoaXMuX2xpbmVCdXR0b24gPSB0aGlzLl9jcmVhdGVCdXR0b24oJ21hcGJveGdsLWN0cmwtZHJhdy1idG4gbGluZScsICdMaW5lIHRvb2wnLCB0aGlzLl9kcmF3TGluZS5iaW5kKG1hcCkpO1xuICAgIHRoaXMuX2NpcmNsZUJ1dHRvbiA9IHRoaXMuX2NyZWF0ZUJ1dHRvbignbWFwYm94Z2wtY3RybC1kcmF3LWJ0biBjaXJjbGUnLCAnQ2lyY2xlIHRvb2wnLCB0aGlzLl9kcmF3Q2lyY2xlLmJpbmQobWFwKSk7XG4gICAgdGhpcy5fc3F1YXJlQnV0dG9uID0gdGhpcy5fY3JlYXRlQnV0dG9uKCdtYXBib3hnbC1jdHJsLWRyYXctYnRuIHNxdWFyZScsICdSZWN0YW5nbGUgdG9vbCcsIHRoaXMuX2RyYXdTcXVhcmUuYmluZChtYXApKTtcbiAgICB0aGlzLl9tYXJrZXJCdXR0b24gPSB0aGlzLl9jcmVhdGVCdXR0b24oJ21hcGJveGdsLWN0cmwtZHJhdy1idG4gbWFya2VyJywgJ01hcmtlciB0b29sJywgdGhpcy5fZHJhd01hcmtlci5iaW5kKG1hcCkpO1xuICAgIHJldHVybiBjb250YWluZXI7XG4gIH0sXG5cbiAgX2RyYXdTaGFwZTogZnVuY3Rpb24obWFwKSB7fSxcbiAgX2RyYXdMaW5lOiBmdW5jdGlvbihtYXApIHt9LFxuICBfZHJhd0NpcmNsZTogZnVuY3Rpb24obWFwKSB7fSxcbiAgX2RyYXdTcXVhcmU6IGZ1bmN0aW9uKG1hcCkge30sXG4gIF9kcmF3TWFya2VyOiBmdW5jdGlvbihtYXApIHt9LFxuXG4gIF9jcmVhdGVCdXR0b246IGZ1bmN0aW9uKGNsYXNzTmFtZSwgdGl0bGUsIGZuKSB7XG4gICAgdmFyIGEgPSBET00uY3JlYXRlKCdidXR0b24nLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lciwge3RpdGxlOiB0aXRsZX0pO1xuICAgIGEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHsgZm4oKTsgfSk7XG4gICAgcmV0dXJuIGE7XG4gIH1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAvKiBNZXJnZSB1c2VyIHByb3ZpZGVkIG9wdGlvbnMgb2JqZWN0IHdpdGggYSBkZWZhdWx0IG9uZVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIENvbnRhaW5pbmcgYW4gb3B0aW9ucyBrZXkgd2l0aCB3aGljaCB0byBtZXJnZVxuICAgKiBAcGFyYW0ge29wdGlvbnN9IG9wdGlvbnMgUHJvdmlkZWQgb3B0aW9ucyB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBzZXRPcHRpb25zOiBmdW5jdGlvbihvYmosIG9wdGlvbnMpIHtcbiAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KCdvcHRpb25zJykpIHtcbiAgICAgICAgICBvYmoub3B0aW9ucyA9IG9iai5vcHRpb25zID8gT2JqZWN0LmNyZWF0ZShvYmoub3B0aW9ucykgOiB7fTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgIG9iai5vcHRpb25zW2ldID0gb3B0aW9uc1tpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmoub3B0aW9ucztcbiAgfVxufTtcbiJdfQ==
