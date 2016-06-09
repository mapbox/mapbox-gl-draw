var area = require('turf-area');
var metas = ['feature', 'midpoint', 'vertex'];

var geometryTypeValues = {
  'Polygon': 2,
  'Point': 0,
  'LineString': 1
};

function sort(a, b) {
  var score = geometryTypeValues[a.geometry.type] - geometryTypeValues[b.geometry.type];

  if (score === 0 && a.geometry.type === 'Polygon') {
    return a.area - b.area;
  }
  else {
    return score;
  }
}

function getUnique(features) {
  if (!features.length) return [];
  var sorted = features.sort(sort);
  var uniqueIds = sorted.map(s => s.properties.id).filter(function(item, pos, ary) {
    return !pos || item !== ary[pos - 1];
  });
  return uniqueIds.map(id => sorted.find(s => s.properties.id === id));
}

// Requires either event or bbox
module.exports = function(event, bbox, ctx) {
  if (ctx.map === null) return [];

  var box;
  if (event) {
    var clickBuffer = ctx.options.clickBuffer;
    box = [
      [event.point.x - clickBuffer, event.point.y - clickBuffer],
      [event.point.x + clickBuffer, event.point.y + clickBuffer]
    ];
  }
  else if (bbox) {
    box = bbox;
  }

  var features = ctx.map.queryRenderedFeatures(box, {
    layers: ctx.options.styles.map(s => s.id)
  });

  features = features.filter(function(feature) {
    var meta = feature.properties.meta;
    return metas.indexOf(meta) !== -1;
  }).map(function(feature) {
    if (feature.geometry.type === 'Polygon') {
      feature.area = area({
        type: 'Feature',
        property: {},
        geometry: feature.geometry
      });
    }
    return feature;
  });

  return getUnique(features);
};
