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
