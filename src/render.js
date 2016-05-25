module.exports = function render() {
  var isStillAlive = this.ctx.map && this.ctx.map.getSource('mapbox-gl-draw-hot') !== undefined;
  if (isStillAlive) { // checks to make sure we still have a map
    var mode = this.ctx.events.currentModeName();
    this.ctx.ui.setClass({
      mode: mode
    });

    var newHotIds = [];
    var newColdIds = [];

    if (this.isDirty) {
      newColdIds = this.featureIds;
    }
    else {
      newHotIds = this.changedIds.filter(id => this.features[id] !== undefined);
      newColdIds = this.sources.hot.filter(function getColdIds(geojson) {
        return geojson.properties.id && newHotIds.indexOf(geojson.properties.id) === -1 && this.features[geojson.properties.id] !== undefined;
      }.bind(this)).map(geojson => geojson.properties.id);
    }

    this.sources.hot = [];
    let lastColdCount = this.sources.cold.length;
    this.sources.cold = this.isDirty ? [] : this.sources.cold.filter(function saveColdFeatures(geojson) {
      var id = geojson.properties.id || geojson.properties.parent;
      return newHotIds.indexOf(id) === -1;
    });

    let changed = [];
    newHotIds.concat(newColdIds).map(function prepForViewUpdates(id) {
      if (newHotIds.indexOf(id) > -1) {
        return {source: 'hot', 'id': id};
      }
      else {
        return {source: 'cold', 'id': id};
      }
    }).forEach(function calculateViewUpdate(change) {
      let {id, source} = change;
      let feature = this.features[id];
      let featureInternal = feature.internal(mode);

      if (source === 'hot' && feature.isValid()) {
        changed.push(feature.toGeoJSON());
      }

      this.ctx.events.currentModeRender(featureInternal, function addGeoJsonToView(geojson) {
        this.sources[source].push(geojson);
      }.bind(this));
    }.bind(this));

    if (lastColdCount !== this.sources.cold.length) {
      this.ctx.map.getSource('mapbox-gl-draw-cold').setData({
        type: 'FeatureCollection',
        features: this.sources.cold
      });
    }

    this.ctx.map.getSource('mapbox-gl-draw-hot').setData({
      type: 'FeatureCollection',
      features: this.sources.hot
    });

    if (changed.length) {
      this.ctx.map.fire('draw.changed', {features: changed});
    }

  }
  this.isDirty = false;
  this.changedIds = [];
};
