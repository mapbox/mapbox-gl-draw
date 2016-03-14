var {noFeature, isOfMetaType, isShiftDown} = require('../common_selectors');

module.exports = function(ctx, opts) {
  // This mode lets you select vertexes and move them around
  // it only lets you do this for one feature
  // the trash can, when you are in this mode, deletes vertecies if any are selected
  // or this single feature otherwise.

  var isThisFeature = function(e) {
    return e.featureTarget && e.featureTarget.properties.parent == opts.featureId;
  }

  var feature = ctx.store.get(opts.featureId);

  var onVertex = function(e) {
    if (isThisFeature(e)) {
      var about = e.featureTarget.properties;
      if (isShiftDown(e) === false) {
        ctx.api.unselectAll();
      }

      feature.selectCoordinate(about.path);
      ctx.events.startMode('one_drag', {
        featureId: opts.featureId,
        startPos: e.lngLat
      });
    }
  }

  var selectVertex = function(e) {
    var about = e.featureTarget.properties;
    if (isShiftDown(e) === false && feature.selectedCoords) {
      feature.selectedCoords = {};
    }

    feature.selectCoordinate(about.path);
  }

  var onMidpoint = function(e) {
    var about = e.featureTarget.properties;
    feature.addCoordinate(about.path, about.lng, about.lat);
    feature.selectCoordinate(about.path);
    ctx.events.startMode('one_drag', {
      featureId: opts.featureId,
      startPos: e.lngLat
    });
  }

  return {
    start: function() {
      ctx.ui.setClass('mapbox-gl-draw_mouse-direct-select');
      feature.drawProperties.direct_selected = true;
      this.on('mousedown', isOfMetaType('vertex'), onVertex);
      this.on('mousedown', isOfMetaType('midpoint'), onMidpoint);
      this.on('click', isOfMetaType('vertex'), selectVertex);
      this.on('doubleclick', () => true, function(e) {
        ctx.api.unselectAll();
        ctx.events.startMode('many_select');
      });
      this.on('click', noFeature, function(e) {
        feature.selectedCoords = {};
        ctx.store.render();
      });
      this.on('delete', function() {
        if (feature.deleteSelectedCoords) {
          feature.deleteSelectedCoords();
          if (ctx.store.get(opts.featureId) === undefined) {
            ctx.events.startMode('many_select');
          }
        }
      });
    },
    stop: function() {
      ctx.ui.clearClass();
      feature.drawProperties.direct_selected = false;
    }
  }
}
