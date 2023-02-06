import * as Constants from '../constants';

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
export default function(parent, startVertex, endVertex) {
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

  const mid = {
    lng: (startCoord[0] + endCoord[0]) / 2,
    lat: (startCoord[1] + endCoord[1]) / 2
  };

  const {id, ...rest} = parent.properties;

  return {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      ...rest,
      meta: Constants.meta.MIDPOINT,
      parent: {id, ...rest},
      lng: mid.lng,
      lat: mid.lat,
      coord_path: endVertex.properties.coord_path
    },
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: [mid.lng, mid.lat]
    }
  };
}
