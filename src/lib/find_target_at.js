
var metas = ['feature', 'midpoint', 'vertex'];

var priorities = {
  'Point': 3,
  'LineString': 2,
  'Polygon': 1,
  'midpoint': 0,
  'vertex': 0
};

var dist = function(pos, coords) {
  if (Array.isArray(coords[0])) {
    return coords.reduce((memo, coord) => {
      return memo.concat(dist(pos, coord));
    }, []).sort()[0];
  }
  else {
    var dLng = Math.abs(pos.lng - coords[0]);
    var dLat = Math.abs(pos.lat - coords[1]);
    return Math.pow((dLng * dLng) + (dLat * dLat), .5);
  }
};

module.exports = function(event, ctx) {

  var sort = function(a, b) {
    var aPri = a.properties.meta === 'feature' ? priorities[a.properties.meta] : priorities[a.properties['meta:type']];
    var bPri = a.properties.meta === 'feature' ? priorities[b.properties.meta] : priorities[b.properties['meta:type']];

    if (aPri !== bPri) {
      return aPri - bPri;
    }
    else {
      var aDist = dist(event.lngLat, a.geometry.coordinates);
      var bDist = dist(event.lngLat, b.geometry.coordinates);
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
