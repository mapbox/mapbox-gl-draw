module.exports = function() {
  var isStillAlive = this.ctx.map.getSource('draw') !== undefined;
  if (isStillAlive) { // checks to make sure we still have a map
    var featureBuckets = Object.keys(this.features).reduce((buckets, id) => {
      let sourceFeatures = this.features[id].getSourceFeatures();

      if (true) {
        buckets.selected = buckets.selected.concat(sourceFeatures)
      }
      else {
        buckets.deselected = buckets.deselected.concat(sourceFeatures)
      }
      return buckets;
    }, { deselected: [], selected: [] });

    if(featureBuckets.selected.length > 0) {
      this.ctx.ui.showButton('trash');
    }
    else {
      this.ctx.ui.hideButton('trash');
    }


    this.ctx.map.getSource('draw').setData({
      type: 'FeatureCollection',
      features: featureBuckets.deselected
    });

    this.ctx.map.getSource('draw-selected').setData({
      type: 'FeatureCollection',
      features: featureBuckets.selected
    });
  }
}
