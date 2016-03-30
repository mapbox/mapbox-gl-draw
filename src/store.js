var {throttle} = require('./lib/util');
var render = require('./render');

var Store = module.exports = function(ctx) {
  this.ctx = ctx;
  this.features = {};
  this.featureIds = [];
  this.renderHistory = {};
  this.featureHistory = {};
  this.render = throttle(render, 16, this);
  this.isDirty = false;
};

Store.prototype.needsUpdate = function(geojson) {
  var feature = this.features[geojson.id];
  var coords = JSON.stringify(geojson.geometry.coordinates);
  return !(feature && this.featureHistory[geojson.id] === coords);
};

Store.prototype.setDirty = function() {
  this.isDirty = true;
};

Store.prototype.add = function(feature) {
  this.features[feature.id] = feature;
  if (this.featureIds.indexOf(feature.id) === -1) {
    this.featureIds.push(feature.id);
  }
  return feature.id;
};

Store.prototype.get = function(id) {
  return this.features[id];
};

Store.prototype.getAll = function() {
  return Object.keys(this.features).map(id => this.features[id]);
};

Store.prototype.delete = function (ids) {
  var deleted = [];
  ids.forEach((id) => {
    var idx = this.featureIds.indexOf(id);
    if (idx !== -1) {
      var feature = this.get(id);
      deleted.push(feature.toGeoJSON());
      delete this.features[id];
      delete this.featureHistory[id];
      this.featureIds.splice(idx, 1);
    }
  });

  if (deleted.length > 0) {
    this.ctx.map.fire('draw.deleted', deleted);
  }
};
