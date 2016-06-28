const CommonSelectors = require('../lib/common_selectors');
const Polygon = require('../feature_types/polygon');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');

module.exports = function(ctx) {

  const polygon = new Polygon(ctx, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[]]
    }
  });
  let currentVertexPosition = 0;

  if (ctx._test) ctx._test.polygon = polygon;

  ctx.store.add(polygon);

  function stopDrawingAndRemove() {
    ctx.store.delete([polygon.id], { silent: true });
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  function handleMouseMove(e) {
    polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
  }

  function handleClick(e) {
    ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    // Finish if we clicked on the first or last point
    if (currentVertexPosition > 0 &&
      (isEventAtCoordinates(e, polygon.coordinates[0][0]) || isEventAtCoordinates(e, polygon.coordinates[0][currentVertexPosition - 1]))
    ) return finish();

    polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    currentVertexPosition++;
  }

  function finish() {
    if (!polygon.isValid()) return stopDrawingAndRemove();
    polygon.removeCoordinate(`0.${currentVertexPosition}`);
    currentVertexPosition--;
    ctx.map.fire(Constants.events.CREATE, {
      features: [polygon.toGeoJSON()]
    });
    ctx.events.changeMode('simple_select', { featureIds: [polygon.id] });
  }

  return {
    start() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.POLYGON);
      this.on('mousemove', CommonSelectors.true, handleMouseMove);
      this.on('click', CommonSelectors.true, handleClick);
      this.on('keyup', CommonSelectors.isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', CommonSelectors.isEnterKey, finish);
    },

    stop: function() {
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // If it's invalid, just destroy the thing
      if (!polygon.isValid()) {
        ctx.store.delete([polygon.id], { silent: true });
      }
    },

    render(geojson, callback) {
      geojson.properties.active = (geojson.properties.id === polygon.id) ? 'true' : 'false';
      geojson.properties.meta = (geojson.properties.active === 'true') ? 'feature' : geojson.properties.meta;

      const coordinateCount = geojson.geometry.coordinates[0].length;
      if (coordinateCount < 2) return;

      // If we've only drawn two vertices, make a LineString instead of a Polygon
      if (geojson.properties.active === 'true' && coordinateCount === 2) {
        let coords = [
          [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
        ];
        return callback({
          type: 'Feature',
          properties: geojson.properties,
          geometry: {
            coordinates: coords,
            type: 'LineString'
          }
        });
      } else if (geojson.properties.active === 'false' || coordinateCount > 2) {
        callback(geojson);
      }
    },
    trash() {
      stopDrawingAndRemove();
    }
  };
};
