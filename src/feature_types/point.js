var Feature =  require('./feature');

var Point = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

Point.prototype = Object.create(Feature.prototype);

Point.prototype.addCoordinate = function() {
  throw new Error('addCoordinate cannot be called on a Point');
}

Point.prototype.selectCoordinate = function() {
  this.select();
}

module.exports = Point;
