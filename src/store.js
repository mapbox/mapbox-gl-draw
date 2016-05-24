var {throttle} = require('./lib/util');
var render = require('./render');

var Store = module.exports = function(ctx) {
  this.ctx = ctx;
  this.features = {};
  this.featureIds = [];
  this.renderHistory = {};
  this.featureHistory = {};
  this.featureHistoryJSON = {};
  this.render = throttle(render, 16, this);
  this.isDirty = false;
  this.zoomLevel = ctx.map.getZoom();
  this.zoomRender = this.zoomLevel;
};

Store.prototype.needsUpdate = function(id, coordString) {
  var feature = this.features[id];
  return !(feature && this.featureHistory[id] === coordString);
};

Store.prototype.setDirty = function() {
  this.isDirty = true;
};

Store.prototype.changeZoom = function() {
  this.zoomLevel = this.ctx.map.getZoom();
  if (Math.abs(this.zoomRender - this.zoomLevel) > 1) {
    this.render();
  }
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
    this.ctx.map.fire('draw.deleted', {featureIds:deleted});
  }
};
