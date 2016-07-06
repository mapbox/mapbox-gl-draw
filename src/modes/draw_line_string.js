const CommonSelectors = require('../lib/common_selectors');
const LineString = require('../feature_types/line_string');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');

module.exports = function(ctx) {
  const line = new LineString(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });
  let currentVertexPosition = 0;

  if (ctx._test) ctx._test.line = line;

  ctx.store.add(line);

  function handleMouseMove(e) {
    // This makes the end of the line follow your mouse around
    line.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  }

  function handleClick(e) {
    ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    // Finish if we clicked on the first or last point
    if (currentVertexPosition > 0 &&
      (isEventAtCoordinates(e, line.coordinates[0]) || isEventAtCoordinates(e, line.coordinates[currentVertexPosition - 1]))
    ) {
      return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [line.id] });
    }

    line.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    currentVertexPosition++;
  }

  return {
    start: function() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.LINE);
      this.on('mousemove', CommonSelectors.true, handleMouseMove);
      this.on('click', CommonSelectors.true, handleClick);
      this.on('keyup', CommonSelectors.isEscapeKey, () => {
        ctx.store.delete([line.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, () => {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [line.id] });
      });
    },

    stop() {
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // check to see if we've deleted this feature
      if (ctx.store.get(line.id) === undefined) return;

      //remove last added coordinate
      line.removeCoordinate(`${currentVertexPosition}`);
      if (line.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [line.toGeoJSON()]
        });
      }
      else {
        ctx.store.delete([line.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render(geojson, callback) {
      const isActiveLine = geojson.properties.id === line.id;
      geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActiveLine) return callback(geojson);

      // Only render the line if it has at least one real coordinate
      if (geojson.geometry.coordinates.length < 2) return;
      geojson.properties.meta = Constants.meta.FEATURE;
      callback(geojson);
    },

    trash() {
      ctx.store.delete([line.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};
