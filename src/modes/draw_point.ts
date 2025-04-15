import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';
import {StrictFeature} from '../types/types';

const DrawPoint = {
  onSetup() {
    const point = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: []
      }
    });

    this.addFeature(point);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);

    this.setActionableState({
      trash: true
    });

    return { point };
  },

  stopDrawingAndRemove(state) {
    this.deleteFeature([state.point.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  _select(state, e) {
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    state.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [state.point.toGeoJSON()]
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.point.id]
    });
  },

  onStop(state) {
    this.activateUIButton();
    if (!state.point.getCoordinate().length) {
      this.deleteFeature([state.point.id], { silent: true });
    }
  },

  toDisplayFeatures(state, geojson: StrictFeature, display) {
    const isActivePoint = geojson.properties.id === state.point.id;
    geojson.properties.active = isActivePoint
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    if (!isActivePoint) return display(geojson);
  },

  onKeyUp(state, e) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      return this.stopDrawingAndRemove(state, e);
    }
  },

  onTap: function (state, e) { return this._select(state, e); },
  onClick: function (state, e) { return this._select(state, e); },
  onTrash: function (state, e) { return this.stopDrawingAndRemove(state, e); }
};

export default DrawPoint;

