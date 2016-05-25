var hat = require('hat');

var Feature = function(ctx, geojson) {
  this.ctx = ctx;
  this.properties = geojson.properties || {};
  this.coordinates = geojson.geometry.coordinates;
  this.atLastRender = null;
  this.id = geojson.id || hat();
  this.type = geojson.geometry.type;
  ctx.store.add(this);
};

Feature.prototype.needsUpdate = function() {
  return this.coordinates.join(' ') !== this.atLastRender;
}

Feature.prototype.pegCoords = function() {
   this.atLastRender = this.coordinates.join(' ');
}

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
