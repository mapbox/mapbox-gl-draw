const CommonSelectors = require('../lib/common_selectors');
const LineString = require('../feature_types/line_string');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const Constants = require('../constants');

module.exports = function(ctx) {
  const line = new LineString(ctx, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: []
    }
  });
  let currentVertexPosition = 0;

  if (ctx._test) ctx._test.line = line;

  ctx.store.add(line);

  function stopDrawingAndRemove() {
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    ctx.store.delete([line.id], { silent: true });
  }

  function handleMouseMove(e) {
    // This makes the end of the line follow your mouse around
    line.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  }

  function handleClick(e) {
    // Finish if we clicked on the first or last point
    if (currentVertexPosition > 0 &&
      (isEventAtCoordinates(e, line.coordinates[0]) || isEventAtCoordinates(e, line.coordinates[currentVertexPosition - 1]))
    ) {
      return finish();
    }

    line.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    currentVertexPosition++;
  }

  function finish() {
    line.removeCoordinate(`${currentVertexPosition}`);
    currentVertexPosition--;
    if (line.isValid()) {
      ctx.map.fire(Constants.events.CREATE, {
        features: [line.toGeoJSON()]
      });
    }
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [line.id] });
  }

  return {
    start: function() {
      ctx.store.clearSelected();
      setTimeout(() => {
        if (ctx.map && ctx.map.doubleClickZoom) {
          ctx.map.doubleClickZoom.disable();
        }
      });
      ctx.ui.queueMapClasses({ mouse: Constants.MOUSE_ADD_CLASS_FRAGMENT });
      ctx.ui.setActiveButton(Constants.types.LINE);
      this.on('mousemove', CommonSelectors.true, handleMouseMove);
      this.on('click', CommonSelectors.true, handleClick);
      this.on('keyup', CommonSelectors.isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', CommonSelectors.isEnterKey, finish);
    },

    stop() {
      setTimeout(() => {
        if (ctx.map && ctx.map.doubleClickZoom) {
          ctx.map.doubleClickZoom.enable();
        }
      }, 0);
      ctx.ui.setActiveButton();

      // If it's invalid, just destroy the thing
      if (!line.isValid()) {
        ctx.store.delete([line.id], { silent: true });
      }
    },

    render(geojson, callback) {
      if (geojson.geometry.coordinates[0] === undefined) return;
      geojson.properties.active = (geojson.properties.id === line.id) ? 'true' : 'false';
      geojson.properties.meta = (geojson.properties.active === 'true') ? 'feature' : geojson.properties.meta;
      callback(geojson);
    },

    trash() {
      stopDrawingAndRemove();
    }
  };
};
