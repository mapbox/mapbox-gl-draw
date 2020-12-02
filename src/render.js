import * as Constants from './constants';

export default function render() {
  // eslint-disable-next-line no-invalid-this
  const store = this;
  const mapExists = store.ctx.map && store.ctx.map.getSource(Constants.SOURCE) !== undefined;
  if (!mapExists) return cleanup();

  const mode = store.ctx.events.currentModeName();

  store.ctx.ui.queueMapClasses({ mode });

  const newIds = store.getAllIds();

  const lastCount = store.source.length;
  store.source = [];

  const changed = lastCount !== store.source.length || newIds.length > 0;
  newIds.forEach(id => renderFeature(id));

  function renderFeature(id) {
    const feature = store.get(id);
    const featureInternal = feature.internal(mode);
    store.ctx.events.currentModeRender(featureInternal, (geojson) => {
      store.source.push(geojson);
    });
  }

  if (changed) {
    store.ctx.map.getSource(Constants.SOURCE).setData({
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: store.source
    });
  }

  if (store._emitSelectionChange) {
    store.ctx.map.fire(Constants.events.SELECTION_CHANGE, {
      features: store.getSelected().map(feature => feature.toGeoJSON()),
      points: store.getSelectedCoordinates().map(coordinate => ({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates: coordinate.coordinates
        }
      }))
    });
    store._emitSelectionChange = false;
  }

  if (store._deletedFeaturesToEmit.length) {
    const geojsonToEmit = store._deletedFeaturesToEmit.map(feature => feature.toGeoJSON());

    store._deletedFeaturesToEmit = [];

    store.ctx.map.fire(Constants.events.DELETE, {
      features: geojsonToEmit
    });
  }

  cleanup();
  store.ctx.map.fire(Constants.events.RENDER, {});

  function cleanup() {
    store.isDirty = false;
    store.clearChangedIds();
  }
}
