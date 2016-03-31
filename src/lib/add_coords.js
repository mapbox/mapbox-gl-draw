var toMidpoint = require('./to_midpoint');
var toVertex = require('./to_vertex');

module.exports = function(geojson, doMidpoints, push, map, selectedCoordPaths) {
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

        if (j > 0 && doMidpoints) {
          push(toMidpoint(geojson.properties.id, twoVertex, oneVertex, map));
        }

        twoVertex = oneVertex;
      }
      if (doMidpoints) {
        push(toMidpoint(geojson.properties.id, oneVertex, startVertex, map));
      }
    }
    else {
      let coord = geojson.geometry.coordinates[i];
      let coord_path = `${i}`;
      oneVertex = toVertex(geojson.properties.id, coord, coord_path, selectedCoordPaths.indexOf(coord_path) > -1);
      push(oneVertex);
      if (i > 0 && doMidpoints) {
        push(toMidpoint(geojson.properties.id, twoVertex, oneVertex, map));
      }
      twoVertex = oneVertex;
    }
  }
}
