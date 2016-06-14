var {throttle} = require('./lib/util');
var SimpleSet = require('./lib/simple_set');
var render = require('./render');

var Store = module.exports = function(ctx) {
  this._features = {};
  this._featureIds = new SimpleSet();
  this._selectedFeatureIds = new SimpleSet();
  this._changedIds = new SimpleSet();
  this.ctx = ctx;
  this.sources = {
    hot: [],
    cold: []
  };
  this.render = throttle(render, 16, this);
  this.isDirty = false;
};

/**
 * Sets the store's state to dirty.
 * @return {Store} this
 */
Store.prototype.setDirty = function() {
  this.isDirty = true;
  return this;
};

/**
 * Sets a feature's state to changed.
 * @param {string} featureId
 * @return {Store} this
 */
Store.prototype.featureChanged = function(featureId) {
  this._changedIds.add(featureId);
  return this;
};

/**
 * Gets the ids of all features currently in changed state.
 * @return {Store} this
 */
Store.prototype.getChangedIds = function() {
  return this._changedIds.values();
};

/**
 * Sets all features to unchanged state.
 * @return {Store} this
 */
Store.prototype.clearChangedIds = function() {
  this._changedIds.clear();
  return this;
};

/**
 * Gets the ids of all features in the store.
 * @return {Store} this
 */
Store.prototype.getAllIds = function() {
  return this._featureIds.values();
};

/**
 * Adds a feature to the store.
 * @param {Object} feature
 * @return {Store} this
 */
Store.prototype.add = function(feature) {
  this.featureChanged(feature.id);
  this._features[feature.id] = feature;
  this._featureIds.add(feature.id);
  return this;
};

/**
 * Deletes a feature or array of features from the store.
 * Cleans up after the deletion by deselecting the features.
 * If changes were made, sets the state to the dirty
 * and fires an event.
 * @param {string | Array<string>} featureIds
 * @return {Store} this
 */
Store.prototype.delete = function(featureIds) {
  var deleted = [];
  [].concat(featureIds).forEach((id) => {
    if (!this._featureIds.has(id)) return;
    var feature = this.get(id);
    deleted.push(feature.toGeoJSON());
    // Must deselect the feature as well as delete it
    this.deselect(id);
    delete this._features[id];
    this._featureIds.delete(id);
  });

  if (deleted.length > 0) {
    this.isDirty = true;
    this.ctx.map.fire('draw.deleted', {featureIds:deleted});
  }
  return this;
};

/**
 * Returns a feature in the store matching the specified value.
 * @return {Object | undefined} feature
 */
Store.prototype.get = function(id) {
  return this._features[id];
};

/**
 * Returns all features in the store.
 * @return {Array<Object>}
 */
Store.prototype.getAll = function() {
  return Object.keys(this._features).map(id => this._features[id]);
};

/**
 * Adds a feature to the current selection.
 * @param {string} featureId
 * @return {Store} this
 */
Store.prototype.select = function(featureId) {
  this._selectedFeatureIds.add(featureId);
  return this;
};

/**
 * Deletes a feature from the current selection.
 * @param {string} featureId
 * @return {Store} this
 */
Store.prototype.deselect = function(featureId) {
  this._selectedFeatureIds.delete(featureId);
  return this;
};

/**
 * Clears the current selection.
 * @return {Store} this
 */
Store.prototype.clearSelected = function() {
  this._selectedFeatureIds.clear();
  return this;
};

/**
 * Sets the store's selection, clearing any prior values.
 * If no feature ids are passed, the store is just cleared.
 * @param {string | Array<string> | undefined} featureIds
 * @return {Store} this
 */
Store.prototype.setSelected = function(featureIds) {
  this.clearSelected();
  if (!featureIds) return;
  [].concat(featureIds).forEach(id => {
    this.select(id);
  });
  return this;
};

/**
 * Returns the ids of features in the current selection.
 * @return {Array<string>} Selected feature ids.
 */
Store.prototype.getSelectedIds = function() {
  return this._selectedFeatureIds.values();
};

/**
 * Indicates whether a feature is selected.
 * @param {string} featureId
 * @return {boolean} `true` if the feature is selected, `false` if not
 */
Store.prototype.isSelected = function(featureId) {
  return this._selectedFeatureIds.has(featureId);
};
