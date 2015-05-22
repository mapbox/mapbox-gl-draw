'use strict';

module.exports = {

  addTo(map) {
    this._map = map;
    var container = this._container = this.onAdd(map);
    if (this.options && this.options.position) {
      var pos = this.options.position;
      var corner = map._controlCorners[pos];
      container.className += ' mapboxgl-ctrl-draw mapboxgl-ctrl';

      if (pos.indexOf('bottom') !== -1) {
        corner.insertBefore(container, corner.firstChild);
      } else {
        corner.appendChild(container);
      }
    }

    return this;
  },

  remove() {
    this._container.parentNode.removeChild(this._container);
    if (this.onRemove) this.onRemove(this._map);
    this._map = null;
    return this;
  }
};
