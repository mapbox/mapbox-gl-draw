'use strict';

var mapboxgl = require('mapbox-gl');

var DOM = {};

/**
 * Captures mouse position
 *
 * @param {Object} e Mouse event
 * @param {Object} el Container element.
 * @returns {Point}
 */
DOM.mousePos = function(e, el) {
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
DOM.create = function(tag, className, container, attributes) {
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
 * Removes classes from an array of DOM elements
 *
 * @param {Array<HTMLElement>} elements
 * @param {String} klass
 */
DOM.removeClass = function(elements, klass) {
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

DOM.setTransform = function(el, value) {
  el.style[transformProp] = value;
};

var selectProp = testProp([
  'userSelect',
  'MozUserSelect',
  'WebkitUserSelect',
  'msUserSelect'
]), userSelect;

DOM.disableSelection = function () {
  if (selectProp) {
    userSelect = docStyle[selectProp];
    docStyle[selectProp] = 'none';
  }
};

DOM.enableSelection = function () {
  if (selectProp) {
    docStyle[selectProp] = userSelect;
  }
};

module.exports.createButton = function(container, opts, controlClass) {
  var attr = { title: opts.title };
  if (opts.id) {
    attr.id = opts.id;
  }
  var a = DOM.create('button', opts.className, container, attr);

  a.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    var el = e.target;

    console.log(el.classList, el.classList.contains('active'));
    if (el.classList.contains('active')) {
      el.classList.remove('active');
    } else {
      DOM.removeClass(document.querySelectorAll('.' + controlClass), 'active');
      el.classList.add('active');
      opts.fn();
    }

  }, true);

  return a;
};

/**
 * Translates features based on mouse location
 *
 * @param {Object} feature - A GeoJSON feature
 * @param {Array<Number>} init - Initial position of the mouse
 * @param {Array<Number>} curr - Current position of the mouse
 * @param {Map} map - Instance of mapboxhl.Map
 * @returns {Object} GeoJSON feature
 */
module.exports.translate = function(feature, init, curr, map) {
  feature = JSON.parse(JSON.stringify(feature));
  var dx = curr.x - init.x;
  var dy = curr.y - init.y;
  var geom = feature.geometry;

  // iterate differently due to GeoJSON nesting
  var l, i;
  if (geom.type === 'Polygon') {
    l = geom.coordinates[0].length;
    for (i = 0; i < l; i++) {
      geom.coordinates[0][i] = translatePoint(geom.coordinates[0][i], dx, dy, map);
    }
  } else if (geom.type === 'LineString') {
    l = geom.coordinates.length;
    for (i = 0; i < l; i++) {
      geom.coordinates[i] = translatePoint(geom.coordinates[i], dx, dy, map);
    }
  } else {
    geom.coordinates = translatePoint(geom.coordinates, dx, dy, map);
  }

  return feature;
};

/**
 * Translate a point based on mouse location
 *
 * @param {Array<Number>} point - [ longitude, latitude ]
 * @param {Number} dx - Difference between the initial x mouse position and current x position
 * @param {Number} dy - Difference between the initial y mouse position and current y position
 * @param {Map} map - Instance of mapboxgl.Map
 * @returns {Array<Number>} new translated point
 */
var translatePoint = function(point, dx, dy, map) {
  var c = map.project([ point[0], point[1] ]);
  c = map.unproject([ c.x + dx, c.y + dy ]);
  return [ c.lng, c.lat ];
};

module.exports.DOM = DOM;
module.exports.translatePoint = translatePoint;
