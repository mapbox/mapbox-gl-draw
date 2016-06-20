import mapboxgl from 'mapbox-gl-js-mock';
import hat from 'hat';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

export function createMap() {

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v8'
  });

  return map;
}

export function click(map, payload) {
  map.fire('mousedown', payload);
  map.fire('mouseup', payload);
}

export function drag(map, payloadDown, payloadUp) {
  map.fire('mousedown', payloadDown);
  map.fire('mousemove', payloadDown);
  map.fire('mousemove', payloadUp);
  map.fire('mouseup', payloadUp);
}

export const features = {
  multiPolygon: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [[[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]]
    }
  },

  line: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [1, 1], [2, 2]]
    }
  },

  point: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  },

  polygon: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  },

  square: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[0,0], [0, 90], [90, 90], [90, 0], [0, 0]]]
    }
  },

  featureCollection: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
        }
      }
    ]
  }

};

export function createFeature(featureType) {
  const feature = features[featureType];
  feature.id = hat();
  feature.toGeoJSON = () => feature;
  return feature;
}

/**
 * Returns an array of an object's own property keys that are
 * not prefixed with `_`, indicating pseudo-privacy.
 *
 * @param {Object} instance
 * @return {Array<string>} Public members
 */
export function getPublicMemberKeys(instance) {
  return Object.keys(instance).filter(k => k[0] !== '_');
}

/**
 * Returns an mock ctx object with just those properties a Feature
 * requires.
 *
 * @return {Object}
 */
export function createMockCtx() {
  return {
    store: {
      featureChanged: spy()
    }
  };
}
