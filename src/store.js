const throttle = require('./lib/throttle');
const toDenseArray = require('./lib/to_dense_array');
const StringSet = require('./lib/string_set');
const render = require('./render');

const Store = module.exports = function(ctx) {
  this._features = {};
  this._featureIds = new StringSet();
  this._selectedFeatureIds = new StringSet();
  this._changedFeatureIds = new StringSet();
  this._deletedFeaturesToEmit = [];
  this._emitSelectionChange = false;
  this.ctx = ctx;
  this.sources = {
    hot: [],
    cold: []
  };
  this.render = throttle(render, 16, this);
  this.isDirty = false;
};


/**
 * Delays all rendering until the returned function is invoked
 * @return {Function} renderBatch
 */
Store.prototype.createRenderBatch = function() {
  const holdRender = this.render;
  let numRenders = 0;
  this.render = function() {
    numRenders++;
  };

  return () => {
    this.render = holdRender;
    if (numRenders > 0) {
      this.render();
    }
  };
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
  this._changedFeatureIds.add(featureId);
  return this;
};

/**
 * Gets the ids of all features currently in changed state.
 * @return {Store} this
 */
Store.prototype.getChangedIds = function() {
  return this._changedFeatureIds.values();
};

/**
 * Sets all features to unchanged state.
 * @return {Store} this
 */
Store.prototype.clearChangedIds = function() {
  this._changedFeatureIds.clear();
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
 *
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
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.delete = function(featureIds, options = {}) {
  toDenseArray(featureIds).forEach(id => {
    if (!this._featureIds.has(id)) return;
    this._featureIds.delete(id);
    this._selectedFeatureIds.delete(id);
    if (!options.silent) {
      if (this._deletedFeaturesToEmit.indexOf(this._features[id]) === -1) {
        this._deletedFeaturesToEmit.push(this._features[id]);
      }
    }
    delete this._features[id];
    this.isDirty = true;
  });
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
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.select = function(featureIds, options = {}) {
  toDenseArray(featureIds).forEach(id => {
    if (this._selectedFeatureIds.has(id)) return;
    this._selectedFeatureIds.add(id);
    this._changedFeatureIds.add(id);
    if (!options.silent) {
      this._emitSelectionChange = true;
    }
  });
  return this;
};

/**
 * Deletes features from the current selection.
 * @param {string | Array<string>} featureIds
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.deselect = function(featureIds, options = {}) {
  toDenseArray(featureIds).forEach(id => {
    if (!this._selectedFeatureIds.has(id)) return;
    this._selectedFeatureIds.delete(id);
    this._changedFeatureIds.add(id);
    if (!options.silent) {
      this._emitSelectionChange = true;
    }
  });
  return this;
};

/**
 * Clears the current selection.
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.clearSelected = function(options = {}) {
  this.deselect(this._selectedFeatureIds.values(), { silent: options.silent });
  return this;
};

/**
 * Sets the store's selection, clearing any prior values.
 * If no feature ids are passed, the store is just cleared.
 * @param {string | Array<string> | undefined} featureIds
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.setSelected = function(featureIds, options = {}) {
  featureIds = toDenseArray(featureIds);

  // Deselect any features not in the new selection
  this.deselect(this._selectedFeatureIds.values().filter(id => {
    return featureIds.indexOf(id) === -1;
  }), { silent: options.silent });

  // Select any features in the new selection that were not already selected
  this.select(featureIds.filter(id => {
    return !this._selectedFeatureIds.has(id);
  }), { silent: options.silent });

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
 * Returns features in the current selection.
 * @return {Array<Object>} Selected features.
 */
Store.prototype.getSelected = function() {
  return this._selectedFeatureIds.values().map(id => this.get(id));
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
 * Sets a property on the given feature
 * @param {string} featureId
 * @param {string} property property
 * @param {string} property value
*/
Store.prototype.setFeatureProperty = function(featureId, property, value) {
  this.get(featureId).setProperty(property, value);
  this.featureChanged(featureId);
};
