var Store = module.exports = function(ctx) {
  this.ctx = ctx;
  this.features = {};
}

Store.prototype.render = function() {};

Store.prototype.add = function(geojson, options) {}

Store.prototype.get = function(id) {}

Store.prototype.getAll = function() {}

Store.prototype.delete = function (id) {
  var feature = this.get(id);
  if (feature) {
    feature.delete();
  }
}
