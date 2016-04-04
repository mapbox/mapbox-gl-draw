
var metas = ['feature', 'midpoint', 'vertex'];

var priorities = {
  'feature': 2,
  'midpoint': 0,
  'vertex': 0
};

var dist = function(a, b) {
  var dLng = Math.abs(a.lng - b.lng);
  var dLat = Math.abs(a.lat - b.lat);

  return Math.pow((dLng * dLng) + (dLat * dLat), .5);
};

module.exports = function(event, ctx) {

  var sort = function(a, b) {
    var aPri = priorities[a.properties.meta];
    var bPri = priorities[b.properties.meta];

    if (aPri !== bPri) {
      return aPri - bPri;
    }
    else if(a.properties.meta === 'feature') {
      return 1;
    }
    else {
      var aDist = dist(event.lngLat, a.properties);
      var bDist = dist(event.lngLat, b.properties);
      return bDist - aDist;
    }
  };

  var grabSize = .5;
  var features = ctx.map.queryRenderedFeatures([[event.point.x - grabSize, event.point.y - grabSize], [event.point.x + grabSize, event.point.y + grabSize]], {});

  features = features.filter(function(feature) {
    var meta = feature.properties.meta;
    return metas.indexOf(meta) !== -1;
  });

  features.sort(sort);

  if (event.dropPoint === true) {
    var lngLat = ctx.map.unproject(event.point);
    ctx.api.add({
      'id': 'testing',
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [lngLat.lng, lngLat.lat]
      }
    });
  }

  if (features[0]) {
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
