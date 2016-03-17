var hat = require('hat');

var Feature = function(ctx, geojson) {
  this.ctx = ctx;
  this.properties = geojson.properties || {};
  this.coordinates = geojson.geometry.coordinates;
  this.id = geojson.id || hat();
  this.type = geojson.geometry.type;
  ctx.store.add(this);
};

Feature.prototype.getCoordinates = function() {
  return JSON.parse(JSON.stringify(this.coordinates));
};

Feature.prototype.toGeoJSON = function() {
  return JSON.parse(JSON.stringify({
    'id': this.id,
    'type': 'Feature',
    'properties': this.properties,
    'geometry': {
      'coordinates': this.getCoordinates(),
      'type': this.type
    }
  }));
};

Feature.prototype.internal = function(mode) {
  return {
    'type': 'Feature',
    'properties': {
      'id': this.id,
      'meta': 'feature',
      'active': 'false',
      mode: mode
    },
    'geometry': {
      'coordinates': this.getCoordinates(),
      'type': this.type
    }
  };
};

module.exports = Feature;
