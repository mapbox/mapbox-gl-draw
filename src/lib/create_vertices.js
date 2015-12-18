export default function(features) {
  var vertices = [];

    for (var id in features) {
      var coords = features[id].toGeoJSON().geometry.coordinates;
      var type = features[id].toGeoJSON().geometry.type;
      if (type === 'LineString' || type === 'Polygon') {
        coords = type === 'Polygon' ? coords[0] : coords;
        var l = type === 'LineString' ? coords.length : coords.length - 1;
        for (var j = 0; j < l; j++) {
          vertices.push({
            type: 'Feature',
            properties: {
              meta: 'vertex',
              parent: features[id].drawId,
              index: j
            },
            geometry: {
              type: 'Point',
              coordinates: coords[j]
            }
          });
        }
      }
    }

    return vertices;
}
