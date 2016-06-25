var isEqual = require('lodash.isequal');
var normalize = require('geojson-normalize');
var hat = require('hat');
var featuresAt = require('./lib/features_at');
var geojsonhint = require('geojsonhint');

var featureTypes = {
  'Polygon': require('./feature_types/polygon'),
  'LineString': require('./feature_types/line_string'),
  'Point': require('./feature_types/point'),
  'MultiPolygon': require('./feature_types/multi_feature'),
  'MultiLineString': require('./feature_types/multi_feature'),
  'MultiPoint': require('./feature_types/multi_feature')
};

module.exports = function(ctx) {

  return {
    getFeatureIdsAt: function(point) {
      var features = featuresAt({point}, null, ctx);
      return features.map(feature => feature.properties.id);
    },
    getSelectedIds: function () {
      return ctx.store.getSelectedIds();
    },
    set: function(featureCollection) {
      if (featureCollection.type === undefined || featureCollection.type !== 'FeatureCollection' || !Array.isArray(featureCollection.features)) {
        throw new Error('Invalid FeatureCollection');
      }
      var toDelete = ctx.store.getAllIds().slice(0);
      var newIds = this.add(featureCollection);

      var newIdsForFasterLookUp = {};
      for (var i = 0; i < newIds.length; i++) {
        newIdsForFasterLookUp[newIds[i]] = 0;
      }

      toDelete = toDelete.filter(id => {
        return newIdsForFasterLookUp[id] === undefined;
      });
      ctx.store.delete(toDelete);

      ctx.store.render();
      return newIds;
    },
    add: function (geojson) {
      var featureCollection = normalize(geojson);
      var errors = geojsonhint.hint(featureCollection);
      if (errors.length) {
        throw new Error(errors[0].message);
      }
      featureCollection = JSON.parse(JSON.stringify(featureCollection));

      var ids = featureCollection.features.map(feature => {
        feature.id = feature.id || hat();

        if (ctx.store.get(feature.id) === undefined) {
          var model = featureTypes[feature.geometry.type];
          let internalFeature = new model(ctx, feature);
          ctx.store.add(internalFeature);
        }
        else {
          let internalFeature = ctx.store.get(feature.id);
          internalFeature.properties = feature.properties;
          if (!isEqual(internalFeature.getCoordinates(), feature.geometry.coordinates)) {
            internalFeature.incomingCoords(feature.geometry.coordinates);
          }
        }
        return feature.id;
      });

      ctx.store.render();
      return ids;
    },
    get: function (id) {
      var feature = ctx.store.get(id);
      if (feature) {
        return feature.toGeoJSON();
      }
    },
    getAll: function() {
      return {
        type: 'FeatureCollection',
        features: ctx.store.getAll().map(feature => feature.toGeoJSON())
      };
    },
    delete: function(id) {
      ctx.store.delete([id], { silent: true });
      ctx.store.render();
    },
    deleteAll: function() {
      ctx.store.delete(ctx.store.getAllIds(), { silent: true });
      ctx.store.render();
    },
    changeMode: function(mode, modeOptions) {
      ctx.events.changeMode(mode, modeOptions, { silent: true });
    },
    trash: function() {
      ctx.events.trash({ silent: true });
    }
  };
};
