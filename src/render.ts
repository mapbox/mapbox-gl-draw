import * as Constants from './constants';

export default function render() {
  // eslint-disable-next-line no-invalid-this
  const store = this;
  const mapExists =
    store.ctx.map &&
    store.ctx.map.getSource(Constants.sources.HOT) !== undefined;
  if (!mapExists) return cleanup();

  const mode = store.ctx.events.currentModeName();

  store.ctx.ui.queueMapClasses({ mode });

  let newHotIds = [];
  let newColdIds = [];

  if (store.isDirty) {
    newColdIds = store.getAllIds();
  } else {
    newHotIds = store.getChangedIds().filter(id => store.get(id) !== undefined);
    newColdIds = store.sources.hot
      .filter(
        geojson =>
          geojson.properties.id &&
          newHotIds.indexOf(geojson.properties.id) === -1 &&
          store.get(geojson.properties.id) !== undefined
      )
      .map(geojson => geojson.properties.id);
  }

  store.sources.hot = [];
  const lastColdCount = store.sources.cold.length;
  store.sources.cold = store.isDirty
    ? []
    : store.sources.cold.filter(geojson => {
        const id = geojson.properties.id || geojson.properties.parent;
        return newHotIds.indexOf(id) === -1;
      });

  const coldChanged =
    lastColdCount !== store.sources.cold.length || newColdIds.length > 0;
  newHotIds.forEach(id => renderFeature(id, 'hot'));
  newColdIds.forEach(id => renderFeature(id, 'cold'));

  function renderFeature(id, source) {
    const feature = store.get(id);
    const featureInternal = feature.internal(mode);
    store.ctx.events.currentModeRender(featureInternal, geojson => {
      geojson.properties.mode = mode;
      store.sources[source].push(geojson);
    });
  }

  if (coldChanged) {
    store.ctx.map.getSource(Constants.sources.COLD).setData({
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: store.sources.cold
    });
  }

  store.ctx.map.getSource(Constants.sources.HOT).setData({
    type: Constants.geojsonTypes.FEATURE_COLLECTION,
    features: store.sources.hot
  });

  cleanup();

  function cleanup() {
    store.isDirty = false;
    store.clearChangedIds();
  }
}
