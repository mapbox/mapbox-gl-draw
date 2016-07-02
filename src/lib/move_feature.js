const Constants = require('../constants');

module.exports = function(feature, lngDelta, latDelta) {
  const featureCoordinates = feature.getCoordinates();

  const moveCoordinate = (coord) => [coord[0] + lngDelta, coord[1] + latDelta];
  const moveRing = (ring) => ring.map(coord => moveCoordinate(coord));
  const moveMultiPolygon = (multi) => multi.map(ring => moveRing(ring));

  if (feature.type === Constants.geojsonTypes.POINT) {
    return feature.incomingCoords(moveCoordinate(featureCoordinates));
  }

  if (feature.type === Constants.geojsonTypes.LINE_STRING || feature.type === Constants.geojsonTypes.MULTI_POINT) {
    return feature.incomingCoords(featureCoordinates.map(moveCoordinate));
  }

  if (feature.type === Constants.geojsonTypes.POLYGON || feature.type === Constants.geojsonTypes.MULTI_LINE_STRING) {
    return feature.incomingCoords(featureCoordinates.map(moveRing));
  }

  if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
    return feature.incomingCoords(featureCoordinates.map(moveMultiPolygon));
  }
};
