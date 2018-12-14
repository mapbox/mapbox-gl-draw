const Constants = require('../constants');

/**
 * Returns GeoJSON for a Point representing the
 * midpoint of another feature.
 *
 * @param {GeoJSON} parent
 * @param {GeoJSON} startVertex
 * @param {GeoJSON} endVertex
 * @param {Object} map
 * @return {GeoJSON} Point
 */
module.exports = function(parent, startVertex, endVertex, map) {
  const startCoord = startVertex.geometry.coordinates;
  const endCoord = endVertex.geometry.coordinates;

  // If a coordinate exceeds the projection, we can't calculate a midpoint,
  // so run away
  if (startCoord[1] > Constants.LAT_RENDERED_MAX ||
    startCoord[1] < Constants.LAT_RENDERED_MIN ||
    endCoord[1] > Constants.LAT_RENDERED_MAX ||
    endCoord[1] < Constants.LAT_RENDERED_MIN) {
    return null;
  }

  const ptA = map.project([ startCoord[0], startCoord[1] ]);
  const ptB = map.project([ endCoord[0], endCoord[1] ]);
  const mid = map.unproject([ (ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2 ]);

  const midpoint = {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      ...parent.properties,
      meta: Constants.meta.MIDPOINT,
      parent: parent.properties && parent.properties.id,
      lng: mid.lng,
      lat: mid.lat,
      coord_path: endVertex.properties.coord_path
    },
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: [mid.lng, mid.lat]
    }
  };
  delete midpoint.properties.id;
  return midpoint;
};
