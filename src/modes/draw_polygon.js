const CommonSelectors = require('../lib/common_selectors');
const Polygon = require('../feature_types/polygon');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const createVertex = require('../lib/create_vertex');

module.exports = function(ctx) {

  const polygon = new Polygon(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]]
    }
  });
  let currentVertexPosition = 0;

  if (ctx._test) ctx._test.polygon = polygon;

  ctx.store.add(polygon);

  return {
    start() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.POLYGON);
      this.on('mousemove', CommonSelectors.true, e => {
        polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, clickAnywhere);
      this.on('click', CommonSelectors.isVertex, clickOnVertex);
      this.on('tap', CommonSelectors.true, clickAnywhere);
      this.on('tap', CommonSelectors.isVertex, clickOnVertex);

      function clickAnywhere(e) {
        if (currentVertexPosition > 0 && isEventAtCoordinates(e, polygon.coordinates[0][currentVertexPosition - 1])) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
        currentVertexPosition++;
        // this fake mousemove causes the initial rendering of the visible vertices
        // necessary for decent mobile UX; if theres a better way to do this, please feel free to optimize
        ctx.events.fire('mousemove', e);
      }
      function clickOnVertex() {
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
      }
      this.on('keyup', CommonSelectors.isEscapeKey, () => {
        ctx.store.delete([polygon.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, () => {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
      });
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
      });
    },

    stop: function() {
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.NONE });
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // check to see if we've deleted this feature
      if (ctx.store.get(polygon.id) === undefined) return;

      //remove last added coordinate
      polygon.removeCoordinate(`0.${currentVertexPosition}`);
      if (polygon.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [polygon.toGeoJSON()]
        });
      } else {
        ctx.store.delete([polygon.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render(geojson, callback) {
      const isActivePolygon = geojson.properties.id === polygon.id;
      geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActivePolygon) return callback(geojson);

      // Don't render a polygon until it has two positions
      // (and a 3rd which is just the first repeated)
      if (geojson.geometry.coordinates.length === 0) return;

      const coordinateCount = geojson.geometry.coordinates[0].length;
      // 2 coordinates after selecting a draw type
      // 3 after creating the first point
      if (coordinateCount < 3) {
        return;
      }
      geojson.properties.meta = Constants.meta.FEATURE;
      callback(createVertex(polygon.id, geojson.geometry.coordinates[0][0], '0.0', false));
      if (coordinateCount > 3) {
        // Add a start position marker to the map, clicking on this will finish the feature
        // This should only be shown when we're in a valid spot
        const endPos = geojson.geometry.coordinates[0].length - 3;
        callback(createVertex(polygon.id, geojson.geometry.coordinates[0][endPos], `0.${endPos}`, false));
      }
      if (coordinateCount <= 4) {
        // If we've only drawn two positions (plus the closer),
        // make a LineString instead of a Polygon
        const lineCoordinates = [
          [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
        ];
        // create an initial vertex so that we can track the first point on mobile devices
        callback({
          type: Constants.geojsonTypes.FEATURE,
          properties: geojson.properties,
          geometry: {
            coordinates: lineCoordinates,
            type: Constants.geojsonTypes.LINE_STRING
          }
        });
        if (coordinateCount === 3) {
          return;
        }
      }
      // render the Polygon
      return callback(geojson);
    },
    trash() {
      ctx.store.delete([polygon.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};
