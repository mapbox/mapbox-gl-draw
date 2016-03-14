var {noFeature, isShiftDown, isFeature, isFeatureButNotPoint} = require('../common_selectors');

var dragFeatures = require('./drag');
var directSelect = require('../one_feature/select');

module.exports = function(ctx) {

  return {
    start: function() {
      this.on('click', noFeature, function(e) {
        ctx.api.unselectAll();
      });

      this.on('mousedown', isFeature, function(e) {
        var id = e.featureTarget.properties.id;
        var feature = ctx.store.get(id);
        if (feature.isSelected() ) {
          feature.unselect();
        }
        else if (isShiftDown(e)) {
          feature.select();
        }
        else {
          ctx.api.unselectAll();
          feature.select();
        }
        ctx.events.startMode('many_drag', {
          startPos: e.lngLat
        });
      });

      this.on('doubleclick', isFeatureButNotPoint, function(e) {

        ctx.events.startMode('one_select', {
          featureId: e.featureTarget.properties.id
        });
      });
    }
  }
}
