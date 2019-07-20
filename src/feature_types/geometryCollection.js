import Constants from '../constants';
import hat from 'hat';
const isEqual = require('lodash.isequal');

const models = {
  Point: require('./point'),
  LineString: require('./line_string'),
  Polygon: require('./polygon')
};

const GeometryCollection = function(ctx, geojson) {
  this.ctx = ctx;
  this.id = geojson.id || hat();
  this.type = 'GeometryCollection';
  this.properties = geojson.properties;
  this.features = geojson.geometry.geometries.map(g => {
    return this._coordinatesToFeatures(g);
  });
};
GeometryCollection.prototype._coordinatesToFeatures = function(geometry) {
  const model = models[geometry.type];
  if (model === undefined) throw new TypeError(`${geometry.type} is not a valid type`);

  const Model = model.bind(this);
  return new Model(this.ctx, {
    id: hat(),
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry
  });
};
GeometryCollection.prototype.changed = function() {
  this.ctx.store.featureChanged(this.id);
};
GeometryCollection.prototype.isValid = function() {
  return this.features.every(f => f.isValid());
};
GeometryCollection.prototype.incomingCoords = function() {
  throw Error('incomingCoords');
};
GeometryCollection.prototype.setCoordinates = function() {
  throw Error('setCoordinates');
};
GeometryCollection.prototype.getCoordinates = function() {
  throw Error('getCoordinates');
};
GeometryCollection.prototype.setProperty = function(property, value) {
  this.properties[property] = value;
};
GeometryCollection.prototype.toGeoJSON = function() {
  const result = JSON.parse(JSON.stringify({
    id: this.id,
    type: Constants.geojsonTypes.FEATURE,
    properties: this.properties,
    geometry: {
      geometries: this.features.map(f => {
        return {
          type: f.type,
          coordinates: f.getCoordinates()
        };
      }),
      type: this.type
    }
  }));
  return result;
};
GeometryCollection.prototype.internal = function(mode) {
  const properties = {
    id: this.id,
    meta: Constants.meta.FEATURE,
    'meta:type': this.type,
    active: Constants.activeStates.INACTIVE,
    mode: mode
  };

  if (this.ctx.options.userProperties) {
    for (const name in this.properties) {
      properties[`user_${name}`] = this.properties[name];
    }
  }
  const result = {
    type: Constants.geojsonTypes.FEATURE,
    properties: properties,
    geometry: {
      type: this.type,
      geometries: this.features.map(f => {
        return {
          type: f.type,
          coordinates: f.getCoordinates()
        };
      })
    }
  };
  return result;
};

GeometryCollection.prototype.isEqual = function(feature) {
  const { geometries } = feature.geometry;
  return this.features.every((myf, index) => {
    return isEqual(myf.getCoordinates(), geometries[index].coordinates);
  });
};

GeometryCollection.prototype.update = function(feature) {
  const { geometries } = feature.geometry;
  this.features.forEach((myf, index) => {
    const coordinates = geometries[index].coordinates;
    if (!isEqual(myf.getCoordinates(), coordinates)) {
      myf.incomingCoords(coordinates);
    }
  });
};

export default GeometryCollection;

