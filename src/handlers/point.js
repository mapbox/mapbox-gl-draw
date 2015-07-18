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

  translate(id, pos) {
    var c = this._map.unproject([pos.x, pos.y]);
    var coords = [c.lng, c.lat];
    var point = this._drawStore.getById(id);
    point = {
      type: 'Feature',
      properties: {
        _drawid: id
      },
      geometry: {
        type: 'Point',
        coordinates: coords
      }
    };
    this._drawStore.update(id, point);
    this._map.fire('draw.feature.update', {
      geojson: this._drawStore.getAll()
    });
  }

});

module.exports = Point;
