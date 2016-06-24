var {isEnterKey, isEscapeKey} = require('../lib/common_selectors');
var Polygon = require('../feature_types/polygon');
const Constants = require('../constants');

module.exports = function(ctx) {

  var feature = new Polygon(ctx, {
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[]]
    }
  });

  ctx.store.add(feature);

  var stopDrawingAndRemove = function() {
    ctx.events.changeMode('simple_select');
    ctx.store.delete([feature.id]);
  };

  var pos = 0;

  var onMouseMove = function(e) {
    feature.updateCoordinate(`0.${pos}`, e.lngLat.lng, e.lngLat.lat);
  };

  var onClick = function(e) {
    ctx.ui.queueMapClasses({mouse:'add'});
    if (pos > 0 && feature.coordinates[0][0][0] === e.lngLat.lng && feature.coordinates[0][0][1] === e.lngLat.lat) {
      // did we click on the first point
      onFinish();
    }
    else if (pos > 0 && feature.coordinates[0][pos - 1][0] === e.lngLat.lng && feature.coordinates[0][pos - 1][1] === e.lngLat.lat) {
      // click on the last point
      onFinish();
    }
    else {
      feature.updateCoordinate(`0.${pos}`, e.lngLat.lng, e.lngLat.lat);
      pos++;
    }

  };

  var onFinish = function() {
    feature.removeCoordinate(`0.${pos}`);
    pos--;
    if (feature.isValid()) {
      ctx.map.fire(Constants.events.CREATE, {
        features: [feature.toGeoJSON()]
      });
    }
    ctx.events.changeMode('simple_select', [feature.id]);
  };

  return {
    start: function() {
      ctx.store.clearSelected();
      setTimeout(() => {
        if (ctx.map && ctx.map.doubleClickZoom) {
          ctx.map.doubleClickZoom.disable();
        }
      }, 0);
      ctx.ui.queueMapClasses({mouse:'add'});
      ctx.ui.setActiveButton(Constants.types.POLYGON);
      this.on('mousemove', () => true, onMouseMove);
      this.on('click', () => true, onClick);
      this.on('keyup', isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', isEnterKey, onFinish);
      this.on('trash', () => true, stopDrawingAndRemove);
    },
    stop: function() {
      setTimeout(() => {
        if (ctx.map && ctx.map.doubleClickZoom) {
          ctx.map.doubleClickZoom.enable();
        }
      }, 0);
      ctx.ui.setActiveButton();
      if (!feature.isValid()) {
        ctx.store.delete([feature.id]);
      }
    },
    render: function(geojson, push) {
      geojson.properties.active = geojson.properties.id === feature.id ? 'true' : 'false';
      geojson.properties.meta = geojson.properties.active === 'true' ? 'feature' : geojson.properties.meta;

      if (geojson.properties.active === 'true' && pos === 1) {
        let coords = [[geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]];
        push({
          'type': 'Feature',
          'properties': geojson.properties,
          'geometry': {
            'coordinates': coords,
            'type': 'LineString'
          }
        });
      }
      else if (geojson.properties.active === 'false' || pos > 1) {
        push(geojson);
      }
    }
  };
};
