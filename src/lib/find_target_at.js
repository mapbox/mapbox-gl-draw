var area = require('turf-area');

var metas = ['feature', 'midpoint', 'vertex', 'too-small'];

var geometryTypeValues = {
  'Polygon': 2,
  'Point': 0,
  'LineString': 1
};

module.exports = function(event, ctx) {

  var sort = function(a, b) {
    var score = geometryTypeValues[a.geometry.type] - geometryTypeValues[b.geometry.type];

    if (score === 0 && a.geometry.type === 'Polygon') {
      return a.area - b.area;
    }
    else {
      return score;
    }
  };

  var grabSize = .5;
  var features = ctx.map.queryRenderedFeatures([[event.point.x - grabSize, event.point.y - grabSize], [event.point.x + grabSize, event.point.y + grabSize]], {});

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

  if (features[0]) {
    console.log(features[0]);
    ctx.ui.setClass({
      feature: features[0].properties.meta,
      mouse: 'hover'
    });
  }
  else {
    ctx.ui.setClass({
      mouse: 'none'
    });
  }

  return features[0];
};
