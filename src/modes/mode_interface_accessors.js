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

/**
 * Sets Draw's interal selected state
 * @param {DrawFeature[]} - whats selected
 */
ModeInterface.prototype.setSelected = function(features) {
  return this._ctx.store.setSelected(features);
};

/**
 * Sets Draw's internal selected coordinate state
 * @param {Object[]} coords - a array of {coord_path: 'string', featureId: 'string'}
 */
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

/**
 * Get all selected features
 * @returns {DrawFeature[]}
 */
ModeInterface.prototype.getSelected = function() {
  return this._ctx.store.getSelected();
};

/**
 * Get the ids of all currently selected features
 * @returns {String[]}
 */
ModeInterface.prototype.getSelectedIds = function() {
  return this._ctx.store.getSelectedIds();
};

/**
 * Check if a feature is selected
 * @param {String} id - a feature id
 * @returns {Boolean}
 */
ModeInterface.prototype.isSelected = function(id) {
  return this._ctx.store.isSelected(id);
};

/**
 * Get a feature by its id
 * @param {String} id - a feature id
 * @returns {DrawFeature}
 */
ModeInterface.prototype.getFeature = function(id) {
  return this._ctx.store.get(id);
};

/**
 * Add a feature to draw's internal selected state
 * @param {String} id
 */
ModeInterface.prototype.select = function(id) {
  return this._ctx.store.select(id);
};

/**
 * Remove a feature from draw's internal selected state
 * @param {String} id
 */
ModeInterface.prototype.deselect = function(id) {
  return this._ctx.store.deselect(id);
};

/**
 * Delete a feature from draw
 * @param {String} id - a feature id
 */
ModeInterface.prototype.deleteFeature = function(id) {
  return this._ctx.store.delete(id);
};

/**
 * Add a feature to Draw
 * @param {DrawFeature} feature - the feature to add
 */
ModeInterface.prototype.addFeature = function(feature) {
  return this._ctx.store.add(feature);
};

/**
 * Clear all selected features
 */
ModeInterface.prototype.clearSelectedFeatures = function() {
  return this._ctx.store.clearSelected();
};

/**
 * Clear all selected coordinates
 */
ModeInterface.prototype.clearSelectedCoordinates = function() {
  return this._ctx.store.clearSelectedCoordinates();
};

/**
 * Indicate if the different action are currently possible with your mode
 * See [draw.actionalbe](https://github.com/mapbox/mapbox-gl-draw/blob/master/API.md#drawactionable) for a list of possible actions.
 * @param {Object} actions
 */
ModeInterface.prototype.setActionableState = function(actions) {
  return this._ctx.events.actionable(actions);
};

/**
 * Trigger a mode change
 * @param {String} mode - the mode to transition into
 * @param {Object} opts - the options object to pass to the new mode
 */
ModeInterface.prototype.changeMode = function(mode, opts) {
  return this._ctx.events.changeMode(mode, opts);
};

/**
 * Update the state of draw map classes
 * @param {Object} opts
 */
ModeInterface.prototype.updateUIClasses = function(opts) {
  return this._ctx.ui.queueMapClasses(opts);
};

/**
 * Get the features at the location of an event object or in a bbox
 * @param {Event||NULL} event - a mapbox-gl event object
 * @param {BBOX||NULL} bbox - the area to get features from
 * @param {String} bufferType - is this `click` or `tap` event, defaults to click
 */
ModeInterface.prototype.featuresAt = function(event, bbox, bufferType = 'click') {
  if (bufferType !== 'click' && bufferType !== 'touch') throw new Error('invalid buffer type');
  return featuresAt[bufferType](event, bbox, this._ctx);
};

/**
 * Create a new {DrawFeature} from geojson
 * @param {GeoJSONFeature} geojson 
 * @returns {DrawFeature}
 */
ModeInterface.prototype.newFeature = function(geojson) {
  const type = geojson.geometry.type;
  if (type === Constants.geojsonTypes.POINT) return new Point(this._ctx, geojson);
  if (type === Constants.geojsonTypes.LINE_STRING) return new LineString(this._ctx, geojson);
  if (type === Constants.geojsonTypes.POLYGON) return new Polygon(this._ctx, geojson);
  return new MultiFeature(this._ctx, geojson);
};

/**
 * Check is an object is an instance of a {DrawFeature}
 * @param {String} type - `Point`, `LineString`, `Polygon`, `MultiFeature`
 * @param {Object} feature - the object that needs to be checked
 * @returns {Boolean}
 */
ModeInterface.prototype.isInstanceOf = function(type, feature) {
  if (type === Constants.geojsonTypes.POINT) return feature instanceof Point;
  if (type === Constants.geojsonTypes.LINE_STRING) return feature instanceof LineString;
  if (type === Constants.geojsonTypes.POLYGON) return feature instanceof Polygon;
  if (type === 'MultiFeature') return feature instanceof MultiFeature;
  throw new Error(`Unknown feature class: ${type}`);
};

/**
 * Force draw to rerender the feature of the provided id
 * @param {String} id - a feature id
 */
ModeInterface.prototype.doRender = function(id) {
  return this._ctx.store.featureChanged(id);
};

