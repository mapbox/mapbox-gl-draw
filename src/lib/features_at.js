var area = require('turf-area');

var metas = ['feature', 'midpoint', 'vertex'];

var geometryTypeValues = {
  'Polygon': 2,
  'Point': 0,
  'LineString': 1
};

const sort = (a, b) => {
  var score = geometryTypeValues[a.geometry.type] - geometryTypeValues[b.geometry.type];

  if (score === 0 && a.geometry.type === 'Polygon') {
    return a.area - b.area;
  }
  else {
    return score;
  }
};

module.exports = function(event, ctx) {
  if (ctx.map === null || !ctx.map.loaded()) return [];
  var clickBuffer = ctx.options.clickBuffer;

  var features = ctx.map.queryRenderedFeatures([
      [event.point.x - clickBuffer, event.point.y - clickBuffer],
      [event.point.x + clickBuffer, event.point.y + clickBuffer]
    ], {});

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

  features.sort(sort);

  return features;
};
