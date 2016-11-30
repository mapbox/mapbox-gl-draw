const features = {
  multiPolygon: {
    type: 'Feature',
    properties: {'a':'b', 'c':'d'},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [[[[1, 1], [2, 2], [2, 6], [4, 3], [1, 1]]]]
    }
  },

  multiPolygon2: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [[1, 1], [2, 2], [4, 3], [1, 1]]
        ],
        [
          [[30, 20], [50, 40], [70, 30], [30, 20]]
        ]
      ]
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

  line2: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[3, 3], [5, 5], [7, 7]]
    }
  },

  multiLineString: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiLineString',
      coordinates: [[[20, 20], [21, 21], [22, 22]], [[30, 30], [31, 31], [32, 32]]]
    }
  },

  multiPoint: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPoint',
      coordinates: [[-5, -5], [-10, -10]]
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

  point2: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [20, 40]
    }
  },

  negativePoint: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [-10, -10]
    }
  },

  polygon: {
    type: 'Feature',
    properties: {'a':'b', 'c':'d'},
    geometry: {
      type: 'Polygon',
      coordinates: [[[30, 20], [50, 40], [70, 30], [50, 20], [30, 20]]]
    }
  },

  polygon2: {
    type: 'Feature',
    properties: {'a2':'b2', 'c2':'d2'},
    geometry: {
      type: 'Polygon',
      coordinates: [[[40, 30], [60, 50], [90, 90], [100, 80], [40, 30]]]
    }
  },

  square: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
    }
  },

  nullGeometry: {
    type: 'Feature',
    properties: {},
    geometry: null
  },

  geometryCollection: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'GeometryCollection',
      geometries: [{
        type: 'Polygon',
        coordinates: [[[30, 20], [50, 40], [70, 30], [50, 20], [30, 20]]]
      }]
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

export default function getGeoJSON (type) {
  return JSON.parse(JSON.stringify(features[type]));
}
