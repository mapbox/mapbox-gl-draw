var {isEnterKey, isEscapeKey} = require('../lib/common_selectors');
var LineString = require('../feature_types/line_string');
const types = require('../lib/types');

module.exports = function(ctx) {

  var feature = new LineString(ctx, {
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'LineString',
      'coordinates': []
    }
  });

  var stopDrawingAndRemove = function() {
    ctx.events.changeMode('simple_select');
    ctx.store.delete([feature.id]);
  };

  var pos = 0;

  var onMouseMove = function(e) {
    ctx.ui.setClass({mouse:'add'});
    if(pos === 0) {
      feature.updateCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      feature.updateCoordinate(1, e.lngLat.lng, e.lngLat.lat);
    }
    else {
      feature.updateCoordinate(pos, e.lngLat.lng, e.lngLat.lat);
    }
  };

  var onClick = function(e) {
    ctx.ui.setClass({mouse:'add'});
     if (pos > 0 && feature.coordinates[0][0] === e.lngLat.lng && feature.coordinates[0][1] === e.lngLat.lat) {
      // did we click on the first point
      onFinish();
    }
    else if (pos > 0 && feature.coordinates[pos - 1][0] === e.lngLat.lng && feature.coordinates[pos - 1][1] === e.lngLat.lat) {
      // click on the last point
      onFinish();
    }
    else {
      feature.updateCoordinate(pos, e.lngLat.lng, e.lngLat.lat);
      pos++;
    }
  };

  var onFinish = function() {
    feature.removeCoordinate(`${pos}`);
    pos--;
    ctx.events.changeMode('simple_select');
  };

  return {
    start: function() {
      ctx.ui.setClass({mouse:'add'});
      ctx.ui.setButtonActive(types.LINE);
      this.on('mousemove', () => true, onMouseMove);
      this.on('click', () => true, onClick);
      this.on('keyup', isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', isEnterKey, onFinish);
      this.on('trash', () => true, stopDrawingAndRemove);
    },
    stop: function() {
      ctx.ui.setButtonInactive(types.LINE);
      if (!feature.isValid()) {
        ctx.store.delete([feature.id]);
      }
    },
    render: function(geojson, push) {
      if (geojson.geometry.coordinates[0] !== undefined) {
        geojson.properties.active = geojson.properties.id === feature.id ? 'true' : 'false';
        geojson.properties.meta = geojson.properties.active === 'true' ? 'feature' : geojson.properties.meta;
        push(geojson);
      }
    }
  };
};
