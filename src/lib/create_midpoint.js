import * as Constants from '../constants.js';
import { toMercator, toWgs84 } from '@turf/projection';

/**
 * Calculate the midpoint in Web Mercator, then convert back to Mercator
 * to ensure the midpoint appears on the projected line.
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

  const start = toMercator(startCoord);
  const end = toMercator(endCoord);

  const round = num => Number(num.toFixed(8));
  const getMidpoint = (a, b) => (a + b) / 2;

  const midpointRaw = toWgs84([
    getMidpoint(start[0], end[0]),
    getMidpoint(start[1], end[1])
  ]);

  const midpoint = [
    round(midpointRaw[0]),
    round(midpointRaw[1])
  ];

  return {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      meta: Constants.meta.MIDPOINT,
      parent,
      lng: midpoint[0],
      lat: midpoint[1],
      coord_path: endVertex.properties.coord_path
    },
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: midpoint
    }
  };
}
