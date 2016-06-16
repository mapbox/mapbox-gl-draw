var throttle = require('./lib/throttle');
var toDenseArray = require('./lib/to_dense_array');
var SimpleSet = require('./lib/simple_set');
var render = require('./render');

var Store = module.exports = function(ctx) {
  this._features = {};
  this._featureIds = new SimpleSet();
  this._selectedFeatureIds = new SimpleSet();
  this._selectedSinceLastFlush = new SimpleSet();
  this._deselectedSinceLastFlush = new SimpleSet();
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
  toDenseArray(featureIds).forEach(id => {
    if (!this._featureIds.has(id)) return;
    deleted.push(this.get(id).toGeoJSON());

    delete this._features[id];
    this._featureIds.delete(id);
    this._selectedFeatureIds.delete(id);
    this._selectedSinceLastFlush.delete(id);
    this._deselectedSinceLastFlush.delete(id);
  });

  if (deleted.length > 0) {
    this.isDirty = true;
    this.ctx.map.fire('draw.deleted', { featureIds: deleted });
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
 * Adds features to the current selection.
 * @param {string | Array<string>} featureIds
 * @return {Store} this
 */
Store.prototype.select = function(featureIds) {
  toDenseArray(featureIds).forEach(id => {
    if (this._selectedFeatureIds.has(id)) return;
    this._selectedFeatureIds.add(id);
    this._selectedSinceLastFlush.add(id);
    this._deselectedSinceLastFlush.delete(id);
  });
  return this;
};

/**
 * Deletes features from the current selection.
 * @param {string | Array<string>} featureIds
 * @return {Store} this
 */
Store.prototype.deselect = function(featureIds) {
  toDenseArray(featureIds).forEach(id => {
    if (!this._selectedFeatureIds.has(id)) return;
    this._selectedFeatureIds.delete(id);
    this._selectedSinceLastFlush.delete(id);
    this._deselectedSinceLastFlush.add(id);
  });
  return this;
};

/**
 * Clears the current selection.
 * @return {Store} this
 */
Store.prototype.clearSelected = function() {
  this.deselect(this._selectedFeatureIds.values());
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
  this.select(featureIds);
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
 * @return {boolean} `true` if the feature is selected, `false` if not.
 */
Store.prototype.isSelected = function(featureId) {
  return this._selectedFeatureIds.has(featureId);
};

/**
 * Get the sets of selected and deselected
 * feature ids since the last flush, and clear those sets.
 *
 * @return {Object} The flushed sets.
 */
Store.prototype.flushSelected = function() {
  const wereSelected = this._selectedSinceLastFlush.values();
  const wereDeselected = this._deselectedSinceLastFlush.values();
  this._selectedSinceLastFlush.clear();
  this._deselectedSinceLastFlush.clear();
  return {
    selected: wereSelected,
    deselected: wereDeselected
  };
};
