module.exports = function(ctx, opts) {

  var features = ctx.store.getAll()
    .filter(feature => feature.isSelected());

  var featureCoords = features.map(feature => feature.getCoordinates());

  var numFeatures = features.length;

  return {
    start: function() {
      ctx.ui.setClass('mapbox-gl-draw_mouse-drag-features');
      if (numFeatures === 0) {
        ctx.events.startMode('many_select');
      }

      this.on('mouseup', () => true, function() {
        ctx.events.startMode('many_select');
      });

      this.on('drag', () => true, function(e) {
        var lngD = e.lngLat.lng - opts.startPos.lng;
        var latD = e.lngLat.lat - opts.startPos.lat;

        for (var i=0; i < numFeatures; i++) {
          var feature = features[i];
          if (feature.type === 'Point') {
            feature.coordinates[0] = featureCoords[i][0] + lngD;
            feature.coordinates[1] = featureCoords[i][1] + latD;
          }
          else if (feature.type === 'LineString') {
            feature.coordinates = featureCoords[i].map(coord => [coord[0] + lngD, coord[1] + latD]);
          }
          else if (feature.type === 'Polygon') {
            feature.coordinates = featureCoords[i].map(ring => ring.map(coord => [coord[0] + lngD, coord[1] + latD]));
          }
        }
        ctx.store.render();
      });
    },
    stop: function() {
      ctx.ui.clearClass();
    }
  }
}
