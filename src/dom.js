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
