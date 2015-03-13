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
    var className = 'mapboxgl-ctrl-nav';
    var container = this._container = DOM.create('div', className, map.getContainer());
    return container;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9jb250cm9sLmpzIiwic3JjL2RvbS5qcyIsInNyYy9kcmF3LmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImB1c2Ugc3RyaWN0YDtcblxuLyoqIEEgZHJhd2luZyBjb21wb25lbnQgZm9yIG1hcGJveGdsXG4gKiBAY2xhc3MgbWFwYm94LkRyYXdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLnBvc2l0aW9uPXRvcHJpZ2h0XSBBIHN0cmluZyBpbmRpY2F0aW5nIHRoZSBjb250cm9sJ3MgcG9zaXRpb24gb24gdGhlIG1hcC4gT3B0aW9ucyBhcmUgYHRvcHJpZ2h0YCwgYHRvcGxlZnRgLCBgYm90dG9tcmlnaHRgLCBgYm90dG9tbGVmdGBcbiAqIEByZXR1cm5zIHtEcmF3fSBgdGhpc2BcbiAqIEBleGFtcGxlXG4gKiB2YXIgbWFwID0gbmV3IG1hcGJveGdsLk1hcCh7XG4gKiAgIGNvbnRhaW5lcjogJ21hcCcsXG4gKiAgIHN0eWxlOiAnaHR0cHM6Ly93d3cubWFwYm94LmNvbS9tYXBib3gtZ2wtc3R5bGVzL3N0eWxlcy9vdXRkb29ycy12Ny5qc29uJ1xuICogfSk7XG4gKlxuICogLy8gSW5pdGlhbGl6ZSB0aGUgZHJhd2luZyBjb21wb25lbnRcbiAqIG1hcC5hZGRDb250cm9sKG5ldyBtYXBib3hnbC5EcmF3KCkpO1xuICovXG5tYXBib3hnbC5EcmF3ID0gcmVxdWlyZSgnLi9zcmMvZHJhdy5qcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBNaXJyb3IgY29udHJvbCBtZXRob2RzIGluIG1hcGJveGdsanNcbiAqIEBleHRlbmRzIHtEcmF3fVxuICogQHJldHVybnMge3RoaXN9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbDtcblxuZnVuY3Rpb24gQ29udHJvbCgpIHt9XG5cbkNvbnRyb2wucHJvdG90eXBlID0ge1xuICBhZGRUbzogZnVuY3Rpb24obWFwKSB7XG4gICAgdGhpcy5fbWFwID0gbWFwO1xuICAgIHRoaXMuX2NvbnRhaW5lciA9IHRoaXMub25BZGQobWFwKTtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5wb3NpdGlvbikgdGhpcy5fY29udGFpbmVyLmNsYXNzTmFtZSArPSAnIG1hcGJveGdsLWN0cmwtJyArIHRoaXMub3B0aW9ucy5wb3NpdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgaWYgKHRoaXMub25SZW1vdmUpIHRoaXMub25SZW1vdmUodGhpcy5fbWFwKTtcbiAgICB0aGlzLl9tYXAgPSBudWxsO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBCdWlsZHMgRE9NIGVsZW1lbnRzXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFnTmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IFtjbGFzc05hbWVdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbnRhaW5lcl0gRE9NIGVsZW1lbnQgdG8gYXBwZW5kIHRvXG4gKiBAcmV0dXJucyB7ZWx9IFRoZSBkb20gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbih0YWdOYW1lLCBjbGFzc05hbWUsIGNvbnRhaW5lcikge1xuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmIChjb250YWluZXIpIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XG4gIHJldHVybiBlbDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG52YXIgRE9NID0gcmVxdWlyZSgnLi9kb20nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhdztcblxuZnVuY3Rpb24gRHJhdyhvcHRpb25zKSB7XG4gIHV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbn1cblxuRHJhdy5wcm90b3R5cGUgPSB1dGlsLmluaGVyaXQoQ29udHJvbCwge1xuICBvcHRpb25zOiB7XG4gICAgcG9zaXRpb246ICd0b3BsZWZ0J1xuICB9LFxuXG4gIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gJ21hcGJveGdsLWN0cmwtbmF2JztcbiAgICB2YXIgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgY2xhc3NOYW1lLCBtYXAuZ2V0Q29udGFpbmVyKCkpO1xuICAgIHJldHVybiBjb250YWluZXI7XG4gIH1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAvKiBNZXJnZSB1c2VyIHByb3ZpZGVkIG9wdGlvbnMgb2JqZWN0IHdpdGggYSBkZWZhdWx0IG9uZVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIENvbnRhaW5pbmcgYW4gb3B0aW9ucyBrZXkgd2l0aCB3aGljaCB0byBtZXJnZVxuICAgKiBAcGFyYW0ge29wdGlvbnN9IG9wdGlvbnMgUHJvdmlkZWQgb3B0aW9ucyB3aXRoIHdoaWNoIHRvIG1lcmdlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBzZXRPcHRpb25zOiBmdW5jdGlvbihvYmosIG9wdGlvbnMpIHtcbiAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KCdvcHRpb25zJykpIHtcbiAgICAgICAgICBvYmoub3B0aW9ucyA9IG9iai5vcHRpb25zID8gT2JqZWN0LmNyZWF0ZShvYmoub3B0aW9ucykgOiB7fTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgIG9iai5vcHRpb25zW2ldID0gb3B0aW9uc1tpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmoub3B0aW9ucztcbiAgfSxcblxuICAvKiBUYWtlIHRoZSBwcm9wZXJ0aWVzIGZyb20gYSBzb3VyY2Ugb2JqZWN0IGFuZCBjb21iaW5lIHRoZW0gd2l0aCBhIGRlc3RpbmF0aW9uIG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3JjXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBkZXN0aW5hdGlvbiBvYmplY3RcbiAgICovXG4gIGV4dGVuZEFsbDogZnVuY3Rpb24oZGVzdCwgc3JjKSB7XG4gICAgZm9yICh2YXIgaSBpbiBzcmMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkZXN0LCBpLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNyYywgaSkpO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICAvKiBJbnRlcmZhY2UgZm9yIGEgcGFyZW50IGNsYXNzIHRvIHNoYXJlIGl0cyBtZXRob2RzIHdpdGggYSBjaGlsZFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wc1xuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgaW5oZXJpdDogZnVuY3Rpb24ocGFyZW50LCBwcm9wcykge1xuICAgIHZhciBwYXJlbnRQcm90byA9IHR5cGVvZiBwYXJlbnQgPT09ICdmdW5jdGlvbicgPyBwYXJlbnQucHJvdG90eXBlIDogcGFyZW50LFxuICAgICAgICBwcm90byA9IE9iamVjdC5jcmVhdGUocGFyZW50UHJvdG8pO1xuICAgICAgICB0aGlzLmV4dGVuZEFsbChwcm90bywgcHJvcHMpO1xuXG4gICAgcmV0dXJuIHByb3RvO1xuICB9XG59O1xuIl19
