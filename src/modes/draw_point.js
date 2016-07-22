const CommonSelectors = require('../lib/common_selectors');
const Point = require('../feature_types/point');
const Constants = require('../constants');

import ModeInterface from './mode_interface';

export default class DrawPointMode extends ModeInterface {
  constructor(options, store, ui) {
    super();
    this.point = new Point({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: []
      }
    });

    store.add(this.point);

    store.clearSelected();
    ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    ui.setActiveButton(Constants.types.POINT);
  }

  onClick(e, store, ui) {
    ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
    this.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [this.point.toGeoJSON()]
    });
    store.setSelected([this.point.id]);
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

  onChangeMode(nextModeName, store, ui) {
    ui.setActiveButton();
    if (!this.point.getCoordinate().length) {
      store.delete([this.point.id], {silent: true});
    }
  }

  prepareAndRender(geojson, render) {
    const isActivePoint = geojson.properties.id === this.point.id;
    geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActivePoint) return render(geojson);
    // Never render the point we're drawing
  }
}
