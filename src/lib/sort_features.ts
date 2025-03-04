import area from '@mapbox/geojson-area';
import * as Constants from '../constants';
import { Feature } from 'geojson';

const FEATURE_SORT_RANKS = {
  Point: 0,
  MultiPoint: 0,
  LineString: 1,
  MultiLineString: 1,
  MultiPolygon: 2,
  Polygon: 2,
  GeometryCollection: 2
};

interface DrawFeature extends Feature {
  area?: number;
}

function comparator(a: DrawFeature, b: DrawFeature) {
  const score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];

  if (
    score === 0 &&
    a.area &&
    b.area &&
    a.geometry.type === Constants.geojsonTypes.POLYGON
  ) {
    return a.area - b.area;
  }

  return score;
}

// Sort in the order above, then sort polygons by area ascending.
function sortFeatures(features: Array<DrawFeature>) {
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
