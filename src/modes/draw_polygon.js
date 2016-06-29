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

  function handleMouseMove(e) {
    polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
  }

  function handleClick(e) {
    ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
    // Finish if we clicked on the first or last point
    if (currentVertexPosition > 0 &&
      (isEventAtCoordinates(e, polygon.coordinates[0][0]) || isEventAtCoordinates(e, polygon.coordinates[0][currentVertexPosition - 1]))
    ) return ctx.events.changeMode('simple_select', { featureIds: [polygon.id] });

    polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    currentVertexPosition++;
  }

  return {
    start() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.POLYGON);
      this.on('mousemove', CommonSelectors.true, handleMouseMove);
      this.on('click', CommonSelectors.true, handleClick);
      this.on('keyup', CommonSelectors.isEscapeKey, () => {
        ctx.store.delete([polygon.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, () => {
        ctx.events.changeMode('simple_select', { featureIds: [polygon.id] });
      });
    },

    stop: function() {
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
      }
      else {
        ctx.store.delete([polygon.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render(geojson, callback) {
      geojson.properties.active = (geojson.properties.id === polygon.id) ? 'true' : 'false';
      geojson.properties.meta = (geojson.properties.active === 'true') ? 'feature' : geojson.properties.meta;

      if (geojson.geometry.coordinates.length === 0) return;
      const coordinateCount = geojson.geometry.coordinates[0].length;
      if (coordinateCount < 3) return;

      // If we've only drawn two vertices, make a LineString instead of a Polygon
      if (geojson.properties.active === 'true' && coordinateCount === 3) {
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
      } else if (geojson.properties.active === 'false' || coordinateCount > 3) {
        callback(geojson);
      }
    },
    trash() {
      ctx.store.delete([polygon.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};
