var Feature = require('./feature');

var Circle = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

Circle.prototype = Object.create(Feature.prototype);

Circle.prototype.isValid = function() {
  return this.coordinates.length > 1;
};

Circle.prototype.addCoordinate = function(path, lng, lat) {
  this.changed();
  var id = parseInt(path, 10);
  this.coordinates.splice(id, 0, [lng, lat]);
};

Circle.prototype.getCoordinate = function(path) {
  var id = parseInt(path, 10);
  return JSON.parse(JSON.stringify(this.coordinates[id]));
};

Circle.prototype.removeCoordinate = function(path) {
  this.changed();
  this.coordinates.splice(parseInt(path, 10), 1);
};

Circle.prototype.updateCoordinate = function(path, lng, lat) {
  var id = parseInt(path, 10);
  this.coordinates[id] = [lng, lat];
  this.changed();
};

module.exports = Circle;
