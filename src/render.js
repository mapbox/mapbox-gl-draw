module.exports = function render() {
  var mapExists = this.ctx.map && this.ctx.map.getSource('mapbox-gl-draw-hot') !== undefined;
  if (mapExists) {
    var mode = this.ctx.events.currentModeName();
    this.ctx.ui.queueContainerClasses({
      mode: mode
    });

    var newHotIds = [];
    var newColdIds = [];

    if (this.isDirty) {
      newColdIds = this.getAllIds();
    }
    else {
      newHotIds = this.getChangedIds().filter(id => this.get(id) !== undefined);
      newColdIds = this.sources.hot.filter(function getColdIds(geojson) {
        return geojson.properties.id && newHotIds.indexOf(geojson.properties.id) === -1 && this.get(geojson.properties.id) !== undefined;
      }.bind(this)).map(geojson => geojson.properties.id);
    }

    this.sources.hot = [];
    let lastColdCount = this.sources.cold.length;
    this.sources.cold = this.isDirty ? [] : this.sources.cold.filter(function saveColdFeatures(geojson) {
      var id = geojson.properties.id || geojson.properties.parent;
      return newHotIds.indexOf(id) === -1;
    });

    var coldChanged = lastColdCount !== this.sources.cold.length || newColdIds.length > 0;

    newHotIds.concat(newColdIds).map(function prepForViewUpdates(id) {
      if (newHotIds.indexOf(id) > -1) {
        return {source: 'hot', 'id': id};
      }
      else {
        return {source: 'cold', 'id': id};
      }
    }).forEach(function calculateViewUpdate(change) {
      let {id, source} = change;
      let feature = this.get(id);
      let featureInternal = feature.internal(mode);

      this.ctx.events.currentModeRender(featureInternal, function addGeoJsonToView(geojson) {
        this.sources[source].push(geojson);
      }.bind(this));
    }.bind(this));

    if (coldChanged) {
      this.ctx.map.getSource('mapbox-gl-draw-cold').setData({
        type: 'FeatureCollection',
        features: this.sources.cold
      });
    }

    this.ctx.map.getSource('mapbox-gl-draw-hot').setData({
      type: 'FeatureCollection',
      features: this.sources.hot
    });

    let changed = this.getChangedIds().map(id => this.get(id))
      .filter(feature => feature !== undefined)
      .filter(feature => feature.isValid())
      .map(feature => feature.toGeoJSON());

    if (changed.length) {
      this.ctx.map.fire('draw.changed', {features: changed});
    }

  }
  this.isDirty = false;
  this.clearChangedIds();
};
