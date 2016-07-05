const extent = require('geojson-extent');
const xtend = require('xtend');
const constrainLatitudeChange = require('./constrain_latitude_change');
const Constants = require('../constants');

module.exports = function(features, delta) {
  const constrainedDelta = xtend(delta, {
    lat: constrainLatitudeChange(features.map(f => f.toGeoJSON()), delta.lat)
  });

  features.forEach(feature => {
    const currentCoordinates = feature.getCoordinates();

    const moveCoordinate = (coord) => [coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat];
    const moveRing = (ring) => ring.map(coord => moveCoordinate(coord));
    const moveMultiPolygon = (multi) => multi.map(ring => moveRing(ring));

    let nextCoordinates;
    if (feature.type === Constants.geojsonTypes.POINT) {
      nextCoordinates = moveCoordinate(currentCoordinates);
    } else if (feature.type === Constants.geojsonTypes.LINE_STRING || feature.type === Constants.geojsonTypes.MULTI_POINT) {
      nextCoordinates = currentCoordinates.map(moveCoordinate);
    } else if (feature.type === Constants.geojsonTypes.POLYGON || feature.type === Constants.geojsonTypes.MULTI_LINE_STRING) {
      nextCoordinates = currentCoordinates.map(moveRing);
    } else if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
      nextCoordinates = currentCoordinates.map(moveMultiPolygon);
    }

    feature.incomingCoords(nextCoordinates);
  });
};
