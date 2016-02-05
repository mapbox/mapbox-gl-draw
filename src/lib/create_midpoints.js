export default function(features, map) {
  var midpoints = [];

    for (var id in features) {
      if (features[id].type === 'square') continue;

      var feat = features[id];
      var c = feat.toGeoJSON().geometry.coordinates;

      if (feat.toGeoJSON().geometry.type === 'LineString' ||
          feat.toGeoJSON().geometry.type === 'Polygon') {

        c = feat.toGeoJSON().geometry.type === 'Polygon' ? c[0] : c;

        for (var j = 0; j < c.length - 1; j++) {
          var ptA = map.project([ c[j][0], c[j][1] ]);
          var ptB = map.project([ c[j + 1][0], c[j + 1][1] ]);
          var mid = map.unproject([ (ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2 ]);
          midpoints.push({
            type: 'Feature',
            properties: {
              meta: 'midpoint',
              parent: feat.drawId,
              index: j + 1,
              lng: mid.lng,
              lat: mid.lat
            },
            geometry: {
              type: 'Point',
              coordinates: [ mid.lng, mid.lat ]
            }
          });
        }

      }
    }

    return midpoints;
}
