import area from '@mapbox/geojson-area';
import * as Constants from '../constants.js';

const FEATURE_SORT_RANKS = {
  Point: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2
};

const META_SORT_RANKS = {
  [Constants.meta.VERTEX]: 0,
  [Constants.meta.MIDPOINT]: 1,
  [Constants.meta.FEATURE]: 2
};

function comparator(a, b) {
  const score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];

  if (score === 0 && a.geometry.type === Constants.geojsonTypes.POLYGON) {
    return a.area - b.area;
  }

  if (score === 0 && a.geometry.type === Constants.geojsonTypes.POINT) {
    const metaA = a.properties && a.properties.meta;
    const metaB = b.properties && b.properties.meta;
    const rankA = META_SORT_RANKS[metaA] !== undefined ? META_SORT_RANKS[metaA] : 3;
    const rankB = META_SORT_RANKS[metaB] !== undefined ? META_SORT_RANKS[metaB] : 3;
    return rankA - rankB;
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
