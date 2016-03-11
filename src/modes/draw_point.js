var selectAll = function() {
  return true;
}

var isEscapeKey = function(e) {
  return e.keyCode === 27;
}

var isEnterKey = function(e) {
  return e.keyCode === 13;
}

module.exports = function(ctx, feature) {

  var stopDrawingAndRemove = function() {
    ctx.events.stopMode();
    ctx.store.delete(feature.id);
  }

  var onMouseMove = function(e) {
    feature.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
  }

  var onClick = function(e) {
    ctx.events.stopMode();
  }

  return {
    start: function() {
      ctx.ui.setClass('mapbox-gl-draw_mouse-add');
      this.on('onMouseMove', selectAll, onMouseMove);
      this.on('onClick', selectAll, onClick);
      this.on('onKeyUp', isEscapeKey, stopDrawingAndRemove);
      this.on('onKeyUp', isEnterKey, stopDrawingAndRemove);
    },
    stop: function() {
      ctx.ui.clearClass();
    }
  }
}
