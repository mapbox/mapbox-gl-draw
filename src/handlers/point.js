'use strict';

let extend = require('xtend');
let handlers = require('./handlers');

function Point(map, options) {
  this.type = 'Point';
  this.initialize(map, options);
}

Point.prototype = extend(handlers, {

  drawStart() {
    this._onClick = this._onClick.bind(this);
    this._map.on('click', this._onClick);
  },

  drawStop() {
    this._map.off('click', this._onClick);
  },

  _onClick(e) {
    var c = this._map.unproject([e.point.x, e.point.y]);
    var coords = [c.lng, c.lat];
    this.drawCreate(this.type, coords);
    this.featureComplete();
  },

  translate(id, prev, pos) {
    // points implement their own translation for efficiency
    var c = this._map.unproject([pos.x, pos.y]);
    var point = {
      type: 'Feature',
      properties: {
        _drawid: id
      },
      geometry: {
        type: 'Point',
        coordinates: [c.lng, c.lat]
      }
    };

    this._drawStore.update(point);

    this._map.fire('edit.feature.update', {
      geojson: this._drawStore.getAll()
    });
  }

});

module.exports = Point;
