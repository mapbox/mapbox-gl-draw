var Feature = require('./feature');

var Point = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

Point.prototype = Object.create(Feature.prototype);

Point.prototype.isValid = function() {
  return typeof this.coordinates[0] === 'number';
};

Point.prototype.updateCoordinate = function(path, lng, lat) {
  this.changed();
  this.coordinates = [lng, lat];
};

module.exports = Point;
