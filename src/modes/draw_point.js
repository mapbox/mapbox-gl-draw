const CommonSelectors = require('../lib/common_selectors');
const Point = require('../feature_types/point');
const Constants = require('../constants');

module.exports = function(ctx) {

  const point = new Point(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: []
    }
  });

  if (ctx._test) ctx._test.point = point;

  ctx.store.add(point);

  function stopDrawingAndRemove() {
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    ctx.store.delete([point.id], { silent: true });
  }

  function handleClick(e) {
    ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
    point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
    ctx.map.fire(Constants.events.CREATE, {
      features: [point.toGeoJSON()]
    });
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id] });
  }

  return {
    start() {
      ctx.store.clearSelected();
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.POINT);
      this.on('click', CommonSelectors.true, handleClick);
      this.on('keyup', CommonSelectors.isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', CommonSelectors.isEnterKey, stopDrawingAndRemove);
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
      });
    },

    stop() {
      ctx.ui.setActiveButton();
      if (!point.getCoordinate().length) {
        ctx.store.delete([point.id], { silent: true });
      }
    },

    render(geojson, callback) {
      const isActivePoint = geojson.properties.id === point.id;
      geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActivePoint) return callback(geojson);
      // Never render the point we're drawing
    },

    trash() {
      stopDrawingAndRemove();
    }
  };
};
