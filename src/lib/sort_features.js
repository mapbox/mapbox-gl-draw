import area from '@mapbox/geojson-area';
import * as Constants from '../constants.js';

const FEATURE_SORT_RANKS = {
  Point: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2
};

const POINT_META_RANKS = {
  vertex: 0,
  midpoint: 1,
  feature: 2
};

function comparator(a, b) {
  const score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];

  if (score === 0 && a.geometry.type === Constants.geojsonTypes.POLYGON) {
    return a.area - b.area;
  }

  // Always consider vertices before midpoints!
  if (score === 0 && a.geometry.type === Constants.geojsonTypes.POINT) {
    return POINT_META_RANKS[a.properties.meta] - POINT_META_RANKS[b.properties.meta];
  }

  return score;
}

// Sort in the order above, then sort polygons by area ascending.
function sortFeatures(features) {
  return features.map((feature) => {
    if (feature.geometry.type === Constants.geojsonTypes.POLYGON) {
      feature.area = area.geometry({
        type: Constants.geojsonTypes.FEATURE,
        property: {},
        geometry: feature.geometry
      });
    }
    return feature;
  }).sort(comparator).map((feature) => {
    delete feature.area;
    return feature;
  });
}

export default sortFeatures;
