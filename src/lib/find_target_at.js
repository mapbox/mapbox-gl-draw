
var metas = ['feature', 'midpoint', 'vertex'];

var priorities = {
  'feature': 2,
  'midpoint': 0,
  'vertex': 0
}

var dist = function(a, b) {
  var dLng = Math.abs(a.lng - b.lng);
  var dLat = Math.abs(a.lat - b.lat);

  return Math.pow((dLng*dLng) + (dLat * dLat), .5);
}

module.exports = function(event, ctx, cb) {

  var sort = function(a, b) {
    var aPri = priorities[a.properties.meta];
    var bPri = priorities[b.properties.meta];

    if (aPri != bPri) {
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
  }

  ctx.map.featuresAt([event.point.x, event.point.y], {
    radius: 20
  }, function(err, features) {
    if (err) {
      throw error;
    }
    else {
      features = features.filter(function(feature) {
        var meta = feature.properties.meta;
        return metas.indexOf(meta) !== -1;
      });

      features.sort(sort);

      cb(features[0]);
    }
  });
}
