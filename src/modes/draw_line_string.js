const CommonSelectors = require('../lib/common_selectors');
const LineString = require('../feature_types/line_string');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');

import ModeInterface from './mode_interface';

export default class DrawLineStringMode extends ModeInterface {
  constructor(store, ui) {
    super();
    this.line = new LineString({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.LINE_STRING,
        coordinates: []
      }
    });

    this.currentVertexPosition = 0;

    store.add(this.line);
    store.clearSelected();
    this.doubleClickZoom(false);
    ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    ui.setActiveButton(Constants.types.LINE);
  }

  onMousemove(e) {
    this.line.updateCoordinate(this.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    if (CommonSelectors.isVertex(e)) {
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
    }
  }

  onClick (e, store) {
    if (CommonSelectors.isVertex(e)) {
      store.setSelected([this.line.id]);
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
    if(this.currentVertexPosition > 0 && isEventAtCoordinates(e, this.line.coordinates[this.currentVertexPosition - 1])) {
      return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [this.line.id] });
    }
    ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    this.line.updateCoordinate(this.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    this.currentVertexPosition++;
  }

  onKeyup(e, store) {
    if (CommonSelectors.isEscapeKey(e)) {
      store.delete([this.line.id], { silent: true});
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }

    if (CommonSelectors.isEnterKey(e)) {
      store.setSelected([this.line.id]);
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  onTrash(store) {
    store.delete([this.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  changeMode(nextModeName, store, ui) {
    this.doubleClickZoom(true);
    ui.setActiveButton();
    if (store.get(this.line.id) === undefined) return;

    //remove last added coordinate
    this.line.removeCoordinate(`${this.currentVertexPosition}`);

    if (this.line.isValid()) {
      this.fire(Constants.events.CREATE, {
        features: [line.toGeoJSON()]
      });
    }
    else {
      store.delete([this.line.id], { silent: true});
      this.changeMode(Constants.modes.SIMPLE_SELECT, {silent: true});
    }
  }

  prepareAndRender(geojson, render) {
    const isActiveLine = geojson.properties.id === this.line.id;
    geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActiveLine) return render(geojson);

    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return;
    geojson.properties.meta = Constants.meta.FEATURE;

    if(geojson.geometry.coordinates.length >= 3) {
      render(createVertex(this.line.id, geojson.geometry.coordinates[geojson.geometry.coordinates.length-2], `${geojson.geometry.coordinates.length-2}`, false));
    }

    render(geojson);
  }

}
