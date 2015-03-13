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

},{"./src/draw.js":"/Users/tristen/dev/mapbox/gl-draw/src/draw.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/control.js":[function(require,module,exports){
'use strict';

/* Mirror control methods in mapboxgljs
 * @extends {Draw}
 * @returns {this}
 */
module.exports = Control;

function Control() {}

Control.prototype = {
  addTo: function(map) {
    this._map = map;
    this._container = this.onAdd(map);
    if (this.options && this.options.position) this._container.className += ' mapboxgl-ctrl-' + this.options.position;
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
 * @param {String} tagName
 * @param {String} [className]
 * @param {Object} [container] DOM element to append to
 * @returns {el} The dom element
 */
module.exports.create = function(tagName, className, container) {
  var el = document.createElement(tagName);
  if (className) el.className = className;
  if (container) container.appendChild(el);
  return el;
};

},{}],"/Users/tristen/dev/mapbox/gl-draw/src/draw.js":[function(require,module,exports){
'use strict';

var Control = require('./control');
var DOM = require('./dom');
var util = require('./util');

module.exports = Draw;

function Draw(options) {
  util.setOptions(this, options);
}

Draw.prototype = util.inherit(Control, {
  options: {
    position: 'topleft'
  },

  onAdd: function(map) {
    var className = 'mapboxgl-ctrl-nav mapboxgl-ctrl-draw';
    var container = this._container = DOM.create('div', className, map.getContainer());

    this._shapeButton = this._createButton('mapboxgl-ctrl-draw-btn shape', this._drawShape.bind(map));
    this._circleButton = this._createButton('mapboxgl-ctrl-draw-btn circle', this._drawCircle.bind(map));
    this._markerButton = this._createButton('mapboxgl-ctrl-draw-btn marker', this._drawMarker.bind(map));

    return container;
  },

  _drawShape: function(map) {},

  _drawCircle: function(map) {},

  _drawMarker: function(map) {},

  _createButton: function(className, fn) {
    var a = DOM.create('button', className, this._container);
    a.addEventListener('click', function() { fn(); });
    return a;
  }
});

},{"./control":"/Users/tristen/dev/mapbox/gl-draw/src/control.js","./dom":"/Users/tristen/dev/mapbox/gl-draw/src/dom.js","./util":"/Users/tristen/dev/mapbox/gl-draw/src/util.js"}],"/Users/tristen/dev/mapbox/gl-draw/src/util.js":[function(require,module,exports){
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

  /* Take the properties from a source object and combine them with a destination object
   *
   * @param {Object} dest
   * @param {Object} src
   * @returns {Object} The destination object
   */
  extendAll: function(dest, src) {
    for (var i in src) {
      Object.defineProperty(dest, i, Object.getOwnPropertyDescriptor(src, i));
    }
    return dest;
  },

  /* Interface for a parent class to share its methods with a child
   *
   * @param {Object} parent
   * @param {Object} props
   * @returns {Object}
   */
  inherit: function(parent, props) {
    var parentProto = typeof parent === 'function' ? parent.prototype : parent,
        proto = Object.create(parentProto);
        this.extendAll(proto, props);

    return proto;
  }
};

},{}]},{},["/Users/tristen/dev/mapbox/gl-draw/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9jb250cm9sLmpzIiwic3JjL2RvbS5qcyIsInNyYy9kcmF3LmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJgdXNlIHN0cmljdGA7XG5cbi8qKiBBIGRyYXdpbmcgY29tcG9uZW50IGZvciBtYXBib3hnbFxuICogQGNsYXNzIG1hcGJveC5EcmF3XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5wb3NpdGlvbj10b3ByaWdodF0gQSBzdHJpbmcgaW5kaWNhdGluZyB0aGUgY29udHJvbCdzIHBvc2l0aW9uIG9uIHRoZSBtYXAuIE9wdGlvbnMgYXJlIGB0b3ByaWdodGAsIGB0b3BsZWZ0YCwgYGJvdHRvbXJpZ2h0YCwgYGJvdHRvbWxlZnRgXG4gKiBAcmV0dXJucyB7RHJhd30gYHRoaXNgXG4gKiBAZXhhbXBsZVxuICogdmFyIG1hcCA9IG5ldyBtYXBib3hnbC5NYXAoe1xuICogICBjb250YWluZXI6ICdtYXAnLFxuICogICBzdHlsZTogJ2h0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LWdsLXN0eWxlcy9zdHlsZXMvb3V0ZG9vcnMtdjcuanNvbidcbiAqIH0pO1xuICpcbiAqIC8vIEluaXRpYWxpemUgdGhlIGRyYXdpbmcgY29tcG9uZW50XG4gKiBtYXAuYWRkQ29udHJvbChuZXcgbWFwYm94Z2wuRHJhdygpKTtcbiAqL1xubWFwYm94Z2wuRHJhdyA9IHJlcXVpcmUoJy4vc3JjL2RyYXcuanMnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogTWlycm9yIGNvbnRyb2wgbWV0aG9kcyBpbiBtYXBib3hnbGpzXG4gKiBAZXh0ZW5kcyB7RHJhd31cbiAqIEByZXR1cm5zIHt0aGlzfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2w7XG5cbmZ1bmN0aW9uIENvbnRyb2woKSB7fVxuXG5Db250cm9sLnByb3RvdHlwZSA9IHtcbiAgYWRkVG86IGZ1bmN0aW9uKG1hcCkge1xuICAgIHRoaXMuX21hcCA9IG1hcDtcbiAgICB0aGlzLl9jb250YWluZXIgPSB0aGlzLm9uQWRkKG1hcCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zaXRpb24pIHRoaXMuX2NvbnRhaW5lci5jbGFzc05hbWUgKz0gJyBtYXBib3hnbC1jdHJsLScgKyB0aGlzLm9wdGlvbnMucG9zaXRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgIGlmICh0aGlzLm9uUmVtb3ZlKSB0aGlzLm9uUmVtb3ZlKHRoaXMuX21hcCk7XG4gICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogQnVpbGRzIERPTSBlbGVtZW50c1xuICogQHBhcmFtIHtTdHJpbmd9IHRhZ05hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBbY2xhc3NOYW1lXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb250YWluZXJdIERPTSBlbGVtZW50IHRvIGFwcGVuZCB0b1xuICogQHJldHVybnMge2VsfSBUaGUgZG9tIGVsZW1lbnRcbiAqL1xubW9kdWxlLmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24odGFnTmFtZSwgY2xhc3NOYW1lLCBjb250YWluZXIpIHtcbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuICByZXR1cm4gZWw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29udHJvbCA9IHJlcXVpcmUoJy4vY29udHJvbCcpO1xudmFyIERPTSA9IHJlcXVpcmUoJy4vZG9tJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYXc7XG5cbmZ1bmN0aW9uIERyYXcob3B0aW9ucykge1xuICB1dGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG59XG5cbkRyYXcucHJvdG90eXBlID0gdXRpbC5pbmhlcml0KENvbnRyb2wsIHtcbiAgb3B0aW9uczoge1xuICAgIHBvc2l0aW9uOiAndG9wbGVmdCdcbiAgfSxcblxuICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9ICdtYXBib3hnbC1jdHJsLW5hdiBtYXBib3hnbC1jdHJsLWRyYXcnO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUsIG1hcC5nZXRDb250YWluZXIoKSk7XG5cbiAgICB0aGlzLl9zaGFwZUJ1dHRvbiA9IHRoaXMuX2NyZWF0ZUJ1dHRvbignbWFwYm94Z2wtY3RybC1kcmF3LWJ0biBzaGFwZScsIHRoaXMuX2RyYXdTaGFwZS5iaW5kKG1hcCkpO1xuICAgIHRoaXMuX2NpcmNsZUJ1dHRvbiA9IHRoaXMuX2NyZWF0ZUJ1dHRvbignbWFwYm94Z2wtY3RybC1kcmF3LWJ0biBjaXJjbGUnLCB0aGlzLl9kcmF3Q2lyY2xlLmJpbmQobWFwKSk7XG4gICAgdGhpcy5fbWFya2VyQnV0dG9uID0gdGhpcy5fY3JlYXRlQnV0dG9uKCdtYXBib3hnbC1jdHJsLWRyYXctYnRuIG1hcmtlcicsIHRoaXMuX2RyYXdNYXJrZXIuYmluZChtYXApKTtcblxuICAgIHJldHVybiBjb250YWluZXI7XG4gIH0sXG5cbiAgX2RyYXdTaGFwZTogZnVuY3Rpb24obWFwKSB7fSxcblxuICBfZHJhd0NpcmNsZTogZnVuY3Rpb24obWFwKSB7fSxcblxuICBfZHJhd01hcmtlcjogZnVuY3Rpb24obWFwKSB7fSxcblxuICBfY3JlYXRlQnV0dG9uOiBmdW5jdGlvbihjbGFzc05hbWUsIGZuKSB7XG4gICAgdmFyIGEgPSBET00uY3JlYXRlKCdidXR0b24nLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lcik7XG4gICAgYS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkgeyBmbigpOyB9KTtcbiAgICByZXR1cm4gYTtcbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8qIE1lcmdlIHVzZXIgcHJvdmlkZWQgb3B0aW9ucyBvYmplY3Qgd2l0aCBhIGRlZmF1bHQgb25lXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogQ29udGFpbmluZyBhbiBvcHRpb25zIGtleSB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gICAqIEBwYXJhbSB7b3B0aW9uc30gb3B0aW9ucyBQcm92aWRlZCBvcHRpb25zIHdpdGggd2hpY2ggdG8gbWVyZ2VcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHNldE9wdGlvbnM6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucykge1xuICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJ29wdGlvbnMnKSkge1xuICAgICAgICAgIG9iai5vcHRpb25zID0gb2JqLm9wdGlvbnMgPyBPYmplY3QuY3JlYXRlKG9iai5vcHRpb25zKSA6IHt9O1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgb2JqLm9wdGlvbnNbaV0gPSBvcHRpb25zW2ldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iai5vcHRpb25zO1xuICB9LFxuXG4gIC8qIFRha2UgdGhlIHByb3BlcnRpZXMgZnJvbSBhIHNvdXJjZSBvYmplY3QgYW5kIGNvbWJpbmUgdGhlbSB3aXRoIGEgZGVzdGluYXRpb24gb2JqZWN0XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIGRlc3RpbmF0aW9uIG9iamVjdFxuICAgKi9cbiAgZXh0ZW5kQWxsOiBmdW5jdGlvbihkZXN0LCBzcmMpIHtcbiAgICBmb3IgKHZhciBpIGluIHNyYykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRlc3QsIGksIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc3JjLCBpKSk7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIC8qIEludGVyZmFjZSBmb3IgYSBwYXJlbnQgY2xhc3MgdG8gc2hhcmUgaXRzIG1ldGhvZHMgd2l0aCBhIGNoaWxkXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJlbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBpbmhlcml0OiBmdW5jdGlvbihwYXJlbnQsIHByb3BzKSB7XG4gICAgdmFyIHBhcmVudFByb3RvID0gdHlwZW9mIHBhcmVudCA9PT0gJ2Z1bmN0aW9uJyA/IHBhcmVudC5wcm90b3R5cGUgOiBwYXJlbnQsXG4gICAgICAgIHByb3RvID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRQcm90byk7XG4gICAgICAgIHRoaXMuZXh0ZW5kQWxsKHByb3RvLCBwcm9wcyk7XG5cbiAgICByZXR1cm4gcHJvdG87XG4gIH1cbn07XG4iXX0=
