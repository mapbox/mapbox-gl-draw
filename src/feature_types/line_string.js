import Feature from './feature.js';

function coordsEqual(a, b) {
  return a && b && a[0] === b[0] && a[1] === b[1];
}

const LineString = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

LineString.prototype = Object.create(Feature.prototype);

LineString.prototype.isValid = function() {
  return this.coordinates.length > 1;
};

LineString.prototype.addCoordinate = function(path, lng, lat) {
  const id = parseInt(path, 10);
  const newCoord = [lng, lat];
  const prev = this.coordinates[id - 1];
  const next = this.coordinates[id];
  if (coordsEqual(newCoord, prev) || coordsEqual(newCoord, next)) {
    return;
  }
  this.changed();
  this.coordinates.splice(id, 0, newCoord);
};

LineString.prototype.getCoordinate = function(path) {
  const id = parseInt(path, 10);
  return JSON.parse(JSON.stringify(this.coordinates[id]));
};

LineString.prototype.removeCoordinate = function(path) {
  this.changed();
  this.coordinates.splice(parseInt(path, 10), 1);
};

LineString.prototype.updateCoordinate = function(path, lng, lat) {
  const id = parseInt(path, 10);
  const newCoord = [lng, lat];
  this.coordinates[id] = newCoord;
  this.changed();
};

LineString.prototype.removeConsecutiveDuplicates = function() {
  let changed = false;
  for (let i = this.coordinates.length - 1; i > 0; i--) {
    if (coordsEqual(this.coordinates[i], this.coordinates[i - 1])) {
      this.coordinates.splice(i, 1);
      changed = true;
    }
  }
  if (changed) this.changed();
};

export default LineString;
