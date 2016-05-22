const toVertex = (parent, coord, path, selected) => ({
  type: 'Feature',
  properties: {
    meta: 'vertex',
    parent: parent,
    coord_path: path,
    active: `${selected}`
  },
  geometry: {
    type: 'Point',
    coordinates: coord
  }
});

module.exports = function(geojson, push, map, selectedCoordPaths) {
  var oneVertex = null;
  var twoVertex = null;
  var startVertex = null;
  for (let i = 0; i < geojson.geometry.coordinates.length; i++) {
    if (geojson.geometry.type === 'Polygon') {
      let ring = geojson.geometry.coordinates[i];
      for (let j = 0; j < ring.length - 1; j++) {
        let coord = ring[j];
        let coord_path = `${i}.${j}`;

        oneVertex = toVertex(geojson.properties.id, coord, coord_path, selectedCoordPaths.indexOf(coord_path) > -1);
        startVertex = startVertex ? startVertex : oneVertex;
        push(oneVertex);

        twoVertex = oneVertex;
      }
    }
    else {
      let coord = geojson.geometry.coordinates[i];
      let coord_path = `${i}`;
      oneVertex = toVertex(geojson.properties.id, coord, coord_path, selectedCoordPaths.indexOf(coord_path) > -1);
      push(oneVertex);
      twoVertex = oneVertex;
    }
  }
};
