var turfEnvelope = require('turf-envelope');
var turfCentroid = require('turf-centroid');
var Immutable = require('immutable');

module.exports = function render() {
  var isStillAlive = this.ctx.map && this.ctx.map.getSource('mapbox-gl-draw-hot') !== undefined;
  if (isStillAlive) { // checks to make sure we still have a map
    var mode = this.ctx.events.currentModeName();
    this.ctx.ui.setClass({
      mode: mode
    });

    var zoomUpdate = Math.abs(this.zoomRender - this.zoomLevel) > 1 || this.isDirty;

    var newHotIds = [];
    var newColdIds = [];

    if (zoomUpdate) {
      this.featureIds.forEach(id => {
        if (this.features[id].needsUpdate()) {
          newHotIds.push(id);
        }
        else {
          newColdIds.push(id);
        }
      })
    }
    else {
      newHotIds = this.featureIds.filter(id => this.features[id].needsUpdate());
      newColdIds = this.sources.hot.filter(geojson => {
        return geojson.properties.id && newHotIds.indexOf(geojson.properties.id) === -1
      }).map(geojson => geojson.properties.id);
    }

    this.sources.hot = [];
    this.sources.cold = zoomUpdate ? [] : this.sources.cold.filter(geojson => {
      var id = geojson.properties.id || geojson.properties.parent;
      return newHotIds.indexOf(id) === -1;
    });

    let changed = [];

    newHotIds.concat(newColdIds).map(id => {
      if (newHotIds.indexOf(id) > -1) {
        return {source: 'hot', 'id': id};
      }
      else {
        return {source: 'cold', 'id': id};
      }
    }).forEach(change => {
      let {id, source} = change;
      let feature = this.features[id];
      let featureInternal = feature.internal(mode);

      if (source === 'hot' && feature.isValid()) {
        changed.push(feature.toGeoJSON());
        feature.pegCoords();
      }

      if (featureInternal.geometry.type !== 'Point') {
        var envelope = turfEnvelope({
          type: 'FeatureCollection',
          features: [featureInternal]
        });

        var topLeftCoord = envelope.geometry.coordinates[0][0];
        var bottomRightCoord = envelope.geometry.coordinates[0][2];

        var topLeftPixels = this.ctx.map.project({
          lng: topLeftCoord[0],
          lat: topLeftCoord[1]
        });

        var bottomRightPixels = this.ctx.map.project({
          lng: bottomRightCoord[0],
          lat: bottomRightCoord[1]
        });

        var dx = Math.abs(topLeftPixels.x - bottomRightPixels.x);
        var dy = Math.abs(topLeftPixels.y - bottomRightPixels.y);

        var distance = Math.pow((dx * dx) + (dy * dy), .5);

        if (distance < 10) {
          featureInternal.properties.meta = 'too-small';
          featureInternal.properties.bounds = JSON.stringify([topLeftCoord, bottomRightCoord]);
          featureInternal.properties.point = turfCentroid({
            type: 'FeatureCollection',
            features: [featureInternal]
          });
        }
      }

      this.ctx.events.currentModeRender(featureInternal, (geojson => {
        var about = geojson.properties;

        if (about.meta === 'too-small' && about.point) {
          geojson.geometry = about.point.geometry;
        }

        delete about.point;

        geojson.properties = about;

        this.sources[source].push(geojson);
      }));
    });

    if (newColdIds.length > 0) {
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
  this.zoomRender = this.zoomLevel;
};
