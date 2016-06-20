const domUtils = {};

/**
 * Creates a new HTML element, appends it to a container,
 * and returns it.
 *
 * @param {string} tag Element name
 * @param {HTMLElement} [container] HTML element to append to
 * @param {Object} [attrbutes] Object containing attributes to apply to the
 * element. The attribute name corresponds to the key.
 * @returns {HTMLElement} The HTML element
 */
domUtils.create = function(tag, container, attributes) {
  const el = document.createElement(tag);
  if (attributes) {
    for (const key in attributes) {
      if (!attributes.hasOwnProperty(key)) continue;
      el.setAttribute(key, attributes[key]);
    }
  }
  if (container) container.appendChild(el);
  return el;
};

/**
 * Removes classes from an array of HTML elements.
 *
 * @param {HTMLElement} elements
 * @param {String} klass
 */
domUtils.removeClass = function(elements, klass) {
  Array.prototype.forEach.call(elements, el => {
    el.classList.remove(klass);
  });
};

module.exports = domUtils;
