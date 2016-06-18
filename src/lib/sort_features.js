const area = require('turf-area');

const FEATURE_SORT_RANKS = {
  'Point': 0,
  'LineString': 1,
  'Polygon': 2
};

function comparator(a, b) {
  const score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];

  if (score === 0 && a.geometry.type === 'Polygon') {
    return a.area - b.area;
  }

  return score;
}

// Sort in the order above, then sort polygons by area ascending.
function sortFeatures(features) {
  const featuresWithAreas = features.map(function(feature) {
    if (feature.geometry.type === 'Polygon') {
      feature.area = area({
        type: 'Feature',
        property: {},
        geometry: feature.geometry
      });
    }
    return feature;
  });
  return featuresWithAreas.sort(comparator).map(function(feature) {
    delete feature.area;
    return feature;
  });
}

module.exports = sortFeatures;
