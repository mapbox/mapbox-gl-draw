const CommonSelectors = require('../lib/common_selectors');
const Point = require('../feature_types/point');
const Constants = require('../constants');

import ModeInterface from './mode_interface';

export default class DrawPointMode extends ModeInterface {
  constructor(store, ui) {
    this.point = new Point({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: []
      }
    });

    store.add(point);

    store.clearSelected();
    ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    ui.setActiveButton(Constants.types.POINT);
  }

  onClick(e, store, ui) {
    ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
    point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [point.toGeoJSON()]
    });
    store.setSelected([point.id]);
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  onKeyup(e, store) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      store.delete([this.point.id], {silent: true});
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  onTrash() {
    store.delete([this.point.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  changeMode(nextModeName, store, ui) {
    ui.setActiveButton();
    if (!this.point.getCoordinate().length) {
      store.delete([point.id], {silent: true});
    }
  }
}
