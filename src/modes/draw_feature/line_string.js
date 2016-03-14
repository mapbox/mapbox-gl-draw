var {isEnterKey, isEscapeKey} = require('../common_selectors');
var LineString = require('../../feature_types/line_string');

module.exports = function(ctx) {

  var geojson = {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "LineString",
      "coordinates": [[0, 0],[0, 0]]
    }
  }

  var feature = new LineString(ctx, geojson);

  var stopDrawingAndRemove = function() {
    ctx.events.startMode('many_select');
    ctx.store.delete(feature.id);
  }

  var pos = 0

  var onMouseMove = function(e) {
    if(pos === 0) {
      feature.updateCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      feature.updateCoordinate(1, e.lngLat.lng, e.lngLat.lat);
    }
    else {
      feature.updateCoordinate(pos, e.lngLat.lng, e.lngLat.lat);
    }
  }

  var onClick = function(e) {
    // did we click on the last point
    // did we click on the first point
    pos++;
  }

  var onFinish = function(e) {
    if(pos < 2) {
      stopDrawingAndRemove();
    }
    else {
      ctx.events.startMode('many_select');
    }
  }

  return {
    start: function() {
      ctx.ui.setClass('mapbox-gl-draw_mouse-add');
      this.on('mousemove', () => true, onMouseMove);
      this.on('click', () => true, onClick);
      this.on('keyup', isEscapeKey, stopDrawingAndRemove);
      this.on('keyup', isEnterKey, onFinish);
    },
    stop: function() {
      ctx.ui.clearClass();
    }
  }
}
