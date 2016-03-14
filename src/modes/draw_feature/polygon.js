var {isEnterKey, isEscapeKey} = require('../common_selectors');
var Polygon = require('../../feature_types/polygon');

module.exports = function(ctx) {

  var geojson = {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[0,0], [0, 0],[0, 0]]]
    }
  }

  var feature = new Polygon(ctx, geojson);

  var stopDrawingAndRemove = function() {
    ctx.events.startMode('many_select');
    ctx.store.delete(feature.id);
  }

  var pos = 0;

  var onMouseMove = function(e) {
    if(pos === 0) {
      feature.updateCoordinate(`0.${0}`, e.lngLat.lng, e.lngLat.lat);
      feature.updateCoordinate(`0.${1}`, e.lngLat.lng, e.lngLat.lat);
    }
    else {
      feature.updateCoordinate(`0.${pos}`, e.lngLat.lng, e.lngLat.lat);
    }
  }

  var onClick = function(e) {
    // did we click on the last point
    // did we click on the first point
    pos++;
  }

  var onFinish = function(e) {
    feature.removeCoordinate(`0.${pos}`);
    pos--;
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
