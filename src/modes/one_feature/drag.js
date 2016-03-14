module.exports = function(ctx, opts) {

  var feature = ctx.store.get(opts.featureId);

  feature.drawProperties.direct_selected = true;

  var selectedCoords = feature.getSelectedCoordinatePaths ? feature.getSelectedCoordinatePaths() : [];
  var coordPos = selectedCoords.map(path => feature.getCoordinate(path));
  var numCoords = selectedCoords.length;

  var changeFn = function(endPos) {
    var lngChange = endPos.lng - opts.startPos.lng;
    var latChange = endPos.lat - opts.startPos.lat;

    for (var i=0; i<numCoords; i++) {
      var path = selectedCoords[i];
      var pos = coordPos[i];
      var lng = pos[0] + lngChange;
      var lat = pos[1] + latChange;
      feature.updateCoordinate(path, lng, lat);
    }
  }

  return {
    start: function() {
      if(numCoords === 0) {
        return ctx.events.startMode('one_select', {
          featureId: opts.featureId
        });
      }
      ctx.ui.setClass('mapbox-gl-draw_mouse-direct-drag');
      this.on('drag', function(e) {
        e.originalEvent.stopPropagation();
        changeFn(e.lngLat);
      });
      this.on('mouseup', function() {
        ctx.events.startMode('one_select', {
          featureId: opts.featureId
        });
      });
    },
    stop: function() {
      feature.drawProperties.direct_selected = false;
      ctx.ui.clearClass();
    }
  }

}
