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
