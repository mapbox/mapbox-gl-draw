var hat = require('hat');

var Feature = function(ctx, geojson) {
  this.ctx = ctx;
  this.properties = geojson.properties || {};
  this.coordinates = geojson.geometry.coordinates;
  this.id = geojson.id || hat();
  this.type = geojson.geometry.type;
};

Feature.prototype.changed = function() {
  this.ctx.store.featureChanged(this.id);
};

Feature.prototype.incomingCoords = function(coords) {
  this.setCoordinates(coords);
};

Feature.prototype.setCoordinates = function(coords) {
  this.coordinates = coords;
  this.changed();
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
      'meta:type': this.type,
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
