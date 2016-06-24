const CommonSelectors = require('../lib/common_selectors');
const Point = require('../feature_types/point');
const Constants = require('../constants');

module.exports = function(ctx) {

  const point = new Point(ctx, {
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'Point',
      'coordinates': []
    }
  });

  if (ctx._test) ctx._test.point = point;

  ctx.store.add(point);

  function stopDrawingAndRemove() {
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    ctx.store.delete([point.id]);
  }

  function handleClick(e) {
    ctx.ui.queueMapClasses({ mouse: Constants.MOUSE_MOVE_CLASS_FRAGMENT });
    point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
    ctx.map.fire(Constants.events.CREATE, {
      features: [point.toGeoJSON()]
    });
    ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, [point.id]);
  }

  return {
    start() {
      ctx.store.clearSelected();
      ctx.ui.queueMapClasses({ mouse: Constants.MOUSE_ADD_CLASS_FRAGMENT });
      ctx.ui.setActiveButton(Constants.types.POINT);
      this.on('click', CommonSelectors.true, handleClick);
      this.on('keyup', CommonSelectors.isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', CommonSelectors.isEnterKey, stopDrawingAndRemove);
      this.on('trash', CommonSelectors.true, stopDrawingAndRemove);
    },

    stop() {
      ctx.ui.setActiveButton();
      if (!point.getCoordinate().length) {
        ctx.store.delete([point.id]);
      }
    },

    render(geojson, push) {
      geojson.properties.active = (geojson.properties.id === point.id) ? 'true' : 'false';
      if (geojson.properties.active === 'false') {
        push(geojson);
      }
    }
  };
};
