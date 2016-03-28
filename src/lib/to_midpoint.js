module.exports = function(parent, startVertex, endVertex, map) {
  var startCoord = startVertex.geometry.coordinates;
  var endCoord = endVertex.geometry.coordinates;

  var ptA = map.project([ startCoord[0], startCoord[1] ]);
  var ptB = map.project([ endCoord[0], endCoord[1] ]);
  var mid = map.unproject([ (ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2 ]);

  return {
    type: 'Feature',
    properties: {
      meta: 'midpoint',
      parent: parent,
      lng: mid.lng,
      lat: mid.lat,
      coord_path: endVertex.properties.coord_path
    },
    geometry: {
      type: 'Point',
      coordinates: [mid.lng, mid.lat]
    }
  };
};
