const CommonSelectors = require('../lib/common_selectors');
const Polygon = require('../feature_types/polygon');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const createVertex = require('../lib/create_vertex');

import ModeInterface from './mode_interface';

export default class DrawPolygonMode extends ModeInterface {
  constructor (options, store, ui) {
    super();
    this.currentVertexPosition = 0;
    this.polygon = new Polygon({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POLYGON,
        coordinates: [[]]
      }
    });

    store.add(this.polygon);
    store.clearSelected();
    this.doubleClickZoom(false);
    ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    ui.setActiveButton(Constants.types.POLYGON);
  }

  onMousemove (e, store, ui) {
    this.polygon.updateCoordinate(`0.${this.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    if (CommonSelectors.isVertex(e)) {
      ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
    }
  }

  onClick (e, store, ui) {
    if (CommonSelectors.isVertex(e)) {
      store.setSelected([this.polygon.id]);
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }

    if (this.currentVertexPosition > 0 && isEventAtCoordinates(e, this.polygon.coordinates[0][this.currentVertexPosition - 1])) {
      store.setSelected([this.polygon.id]);
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }

    ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    this.polygon.updateCoordinate(`0.${this.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    this.currentVertexPosition++;
  }

  onKeyup (e, store) {
    if (CommonSelectors.isEscapeKey(e)) {
      store.delete([this.polygon.id], { silent: true});
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }

    if (CommonSelectors.isEnterKey(e)) {
      store.setSelected([this.polygon.id]);
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  onTrash(store) {
    store.delete([this.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  onChangeMode (nextModeName, store, ui) {
    ui.queueMapClasses({ mouse: Constants.cursors.NONE });
    this.doubleClickZoom(true);
    ui.setActiveButton();

    // check to see if we've deleted this feature
    if(store.get(this.polygon.id) === undefined) return;

   //remove last added coordinate
    this.polygon.removeCoordinate(`0.${currentVertexPosition}`);
    if (this.polygon.isValid()) {
      this.fire(Constants.events.CREATE, {
        features: [this.polygon.toGeoJSON()]
      });
    }
    else {
      store.delete([this.polygon.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
  }
  prepareAndRender(geojson, render) {
    const isActivePolygon = geojson.properties.id === this.polygon.id;
    geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActivePolygon) return render(geojson);

    // Don't render a polygon until it has two positions
    // (and a 3rd which is just the first repeated)
    if (geojson.geometry.coordinates.length === 0) return;

    const coordinateCount = geojson.geometry.coordinates[0].length;

    // If we have fewer than two positions (plus the closer),
    // it's not yet a shape to render
    if (coordinateCount < 3) return;

    geojson.properties.meta = Constants.meta.FEATURE;

    if (coordinateCount > 4) {
      // Add a start position marker to the map, clicking on this will finish the feature
      // This should only be shown when we're in a valid spot
      render(createVertex(this.polygon.id, geojson.geometry.coordinates[0][0], '0.0', false));
      let endPos = geojson.geometry.coordinates[0].length - 3;
      render(createVertex(this.polygon.id, geojson.geometry.coordinates[0][endPos], `0.${endPos}`, false));
    }

    // If we have more than two positions (plus the closer),
    // render the Polygon
    if (coordinateCount > 3) {
      return render(geojson);
    }

    // If we've only drawn two positions (plus the closer),
    // make a LineString instead of a Polygon
    const lineCoordinates = [
      [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
    ];
    return render({
      type: Constants.geojsonTypes.FEATURE,
      properties: geojson.properties,
      geometry: {
        coordinates: lineCoordinates,
        type: Constants.geojsonTypes.LINE_STRING
      }
    });
  }
}
