const Constants = require('../constants');
const featuresAt = require('../lib/features_at');
const Point = require('../feature_types/point');
const LineString = require('../feature_types/line_string');
const Polygon = require('../feature_types/polygon');
const MultiFeature = require('../feature_types/multi_feature');

const ModeInterface = module.exports = function(ctx) {
  this.map = ctx.map;
  this.drawConfig = JSON.parse(JSON.stringify(ctx.options));
  this._ctx = ctx;
};

ModeInterface.prototype.setSelected = function(features) {
  return this._ctx.store.setSelected(features);
};

ModeInterface.prototype.setSelectedCoordinates = function(coords) {
  this._ctx.store.setSelectedCoordinates(coords);
  coords.reduce((m, c) => {
    if (m[c.feature_id] === undefined) {
      m[c.feature_id] = true;
      this._ctx.store.get(c.feature_id).changed();
    }
    return m;
  }, {});
};

ModeInterface.prototype.getSelected = function() {
  return this._ctx.store.getSelected();
};

ModeInterface.prototype.getSelectedIds = function() {
  return this._ctx.store.getSelectedIds();
};

ModeInterface.prototype.isSelected = function(id) {
  return this._ctx.store.isSelected(id);
};

ModeInterface.prototype.getFeature = function(id) {
  return this._ctx.store.get(id);
};

ModeInterface.prototype.select = function(id) {
  return this._ctx.store.select(id);
};

ModeInterface.prototype.deselect = function(id) {
  return this._ctx.store.deselect(id);
};

ModeInterface.prototype.deleteFeature = function(id) {
  return this._ctx.store.delete(id);
};

ModeInterface.prototype.addFeature = function(feature) {
  return this._ctx.store.add(feature);
};

ModeInterface.prototype.clearSelectedFeatures = function() {
  return this._ctx.store.clearSelected();
};

ModeInterface.prototype.clearSelectedCoordinates = function() {
  return this._ctx.store.clearSelectedCoordinates();
};

ModeInterface.prototype.setActionableState = function(actions) {
  return this._ctx.events.actionable(actions);
};

ModeInterface.prototype.changeMode = function(mode, opts) {
  return this._ctx.events.changeMode(mode, opts);
};

ModeInterface.prototype.updateUIClasses = function(opts) {
  return this._ctx.ui.queueMapClasses(opts);
};

ModeInterface.prototype.featuresAt = function(event, bbox, bufferType = 'click') {
  if (bufferType !== 'click' && bufferType !== 'touch') throw new Error('invalid buffer type');
  return featuresAt[bufferType](event, bbox, this._ctx);
};

ModeInterface.prototype.newFeature = function(geojson) {
  const type = geojson.geometry.type;
  if (type === Constants.geojsonTypes.POINT) return new Point(this._ctx, geojson);
  if (type === Constants.geojsonTypes.LINE_STRING) return new LineString(this._ctx, geojson);
  if (type === Constants.geojsonTypes.POLYGON) return new Polygon(this._ctx, geojson);
  return new MultiFeature(this._ctx, geojson);
};

ModeInterface.prototype.isInstanceOf = function(type, feature) {
  if (type === Constants.geojsonTypes.POINT) return feature instanceof Point;
  if (type === Constants.geojsonTypes.LINE_STRING) return feature instanceof LineString;
  if (type === Constants.geojsonTypes.POLYGON) return feature instanceof Polygon;
  if (type === 'MultiFeature') return feature instanceof MultiFeature;
  throw new Error(`Unknown feature class: ${type}`);
};

ModeInterface.prototype.doRender = function(id) {
  return this._ctx.store.featureChanged(id);
};

