const extent = require('geojson-extent');
const Constants = require('../constants');

module.exports = function(geojson) {
  if (geojson.type === Constants.geojsonTypes.POINT) {
    const lat = geojson.geometry.coordinates[1];
    return { north: lat, south: lat };
  }

  const bounds = extent(geojson);
  return {
    north: bounds[3],
    south: bounds[1]
  };
};
