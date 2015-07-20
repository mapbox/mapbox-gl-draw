'use strict';

/**
 * Merge user provided options object with a default one
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

/**
 * Captures mouse position
 *
 * @param {Object} e Mouse event
 * @param {Object} el Container element.
 * @returns {Point}
 */
module.exports.DOM.mousePos = function(e, el) {
  var rect = el.getBoundingClientRect();
  return new mapboxgl.Point(
    e.clientX - rect.left - el.clientLeft,
    e.clientY - rect.top - el.clientTop
  );
};

/**
 * Builds DOM elements
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

/**
 * Removes DOM elements
 *
 * @param {el} The DOM element
 */
module.exports.DOM.destroy = function(el) {
  el.parentElement.removeChild(el);
};

/**
 * Removes classes from an array of DOM elements
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

var transformProp = testProp([
  'transform',
  'WebkitTransform'
]);

module.exports.DOM.setTransform = function(el, value) {
  el.style[transformProp] = value;
};

var selectProp = testProp([
  'userSelect',
  'MozUserSelect',
  'WebkitUserSelect',
  'msUserSelect'
]), userSelect;

module.exports.DOM.disableSelection = function () {
  if (selectProp) {
    userSelect = docStyle[selectProp];
    docStyle[selectProp] = 'none';
  }
};

module.exports.DOM.enableSelection = function () {
  if (selectProp) {
    docStyle[selectProp] = userSelect;
  }
};
