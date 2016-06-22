module.exports = function render() {
  const store = this;
  var mapExists = store.ctx.map && store.ctx.map.getSource('mapbox-gl-draw-hot') !== undefined;
  if (!mapExists) return cleanup();

  var mode = store.ctx.events.currentModeName();
  store.ctx.ui.queueMapClasses({
    mode: mode
  });

  var newHotIds = [];
  var newColdIds = [];

  if (store.isDirty) {
    newColdIds = store.getAllIds();
  }
  else {
    newHotIds = store.getChangedIds().filter(id => store.get(id) !== undefined);
    newColdIds = store.sources.hot.filter(function getColdIds(geojson) {
      return geojson.properties.id && newHotIds.indexOf(geojson.properties.id) === -1 && store.get(geojson.properties.id) !== undefined;
    }).map(geojson => geojson.properties.id);
  }

  store.sources.hot = [];
  let lastColdCount = store.sources.cold.length;
  store.sources.cold = store.isDirty ? [] : store.sources.cold.filter(function saveColdFeatures(geojson) {
    var id = geojson.properties.id || geojson.properties.parent;
    return newHotIds.indexOf(id) === -1;
  });

  var coldChanged = lastColdCount !== store.sources.cold.length || newColdIds.length > 0;

  newHotIds.concat(newColdIds).concat(newColdIds).map(function prepForViewUpdates(id) {
    if (newHotIds.indexOf(id) > -1) {
      return {source: 'hot', 'id': id};
    }
    else {
      return {source: 'cold', 'id': id};
    }
  }).forEach(function calculateViewUpdate(change) {
    let {id, source} = change;
    let feature = store.get(id);
    let featureInternal = feature.internal(mode);

    store.ctx.events.currentModeRender(featureInternal, function addGeoJsonToView(geojson) {
      store.sources[source].push(geojson);
    });
  });

  if (coldChanged) {
    store.ctx.map.getSource('mapbox-gl-draw-cold').setData({
      type: 'FeatureCollection',
      features: store.sources.cold
    });
  }

  store.ctx.map.getSource('mapbox-gl-draw-hot').setData({
    type: 'FeatureCollection',
    features: store.sources.hot
  });

  let changed = store.getChangedIds().map(id => store.get(id))
    .filter(feature => feature !== undefined)
    .filter(feature => feature.isValid())
    .map(feature => feature.toGeoJSON());

  if (changed.length) {
    store.ctx.map.fire('draw.changed', {features: changed});
  }

  const flushedSelectionSets = store.flushSelected();
  if (flushedSelectionSets.selected.length) {
    store.ctx.map.fire('draw.select', { featureIds: flushedSelectionSets.selected });
  }
  if (flushedSelectionSets.deselected.length) {
    store.ctx.map.fire('draw.deselect', { featureIds: flushedSelectionSets.deselected });
  }

  cleanup();

  function cleanup() {
    store.isDirty = false;
    store.clearChangedIds();
  }
};
