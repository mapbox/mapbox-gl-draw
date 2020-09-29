import Feature from './feature';

const Lasso = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(ring => ring.slice(0, -1));
};

Lasso.prototype = Object.create(Feature.prototype);

Lasso.prototype.isValid = function() {
  if (this.coordinates.length === 0) return false;
  return this.coordinates.every(ring => ring.length > 2);
};

// Expects valid geoJSON Lasso geometry: first and last positions must be equivalent.
Lasso.prototype.incomingCoords = function(coords) {
  this.coordinates = coords.map(ring => ring.slice(0, -1));
  this.changed();
};

// Does NOT expect valid geoJSON Lasso geometry: first and last positions should not be equivalent.
Lasso.prototype.setCoordinates = function(coords) {
  this.coordinates = coords;
  this.changed();
};

Lasso.prototype.addCoordinate = function(path, lng, lat) {
  this.changed();
  const ids = path.split('.').map(x => parseInt(x, 10));

  const ring = this.coordinates[ids[0]];

  ring.splice(ids[1], 0, [lng, lat]);
};

Lasso.prototype.removeCoordinate = function(path) {
  this.changed();
  const ids = path.split('.').map(x => parseInt(x, 10));
  const ring = this.coordinates[ids[0]];
  if (ring) {
    ring.splice(ids[1], 1);
    if (ring.length < 3) {
      this.coordinates.splice(ids[0], 1);
    }
  }
};

Lasso.prototype.getCoordinate = function(path) {
  const ids = path.split('.').map(x => parseInt(x, 10));
  const ring = this.coordinates[ids[0]];
  return JSON.parse(JSON.stringify(ring[ids[1]]));
};

Lasso.prototype.getCoordinates = function() {
  return this.coordinates.map(coords => coords.concat([coords[0]]));
};

Lasso.prototype.updateCoordinate = function(path, lng, lat) {
  this.changed();
  const parts = path.split('.');
  const ringId = parseInt(parts[0], 10);
  const coordId = parseInt(parts[1], 10);

  if (this.coordinates[ringId] === undefined) {
    this.coordinates[ringId] = [];
  }

  this.coordinates[ringId][coordId] = [lng, lat];
};

export default Lasso;
