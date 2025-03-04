import * as Constants from '../constants';
import type { Feature } from 'geojson';

export const createVertex = (parentId: string, coordinates: [number, number], path: string, selected: boolean): Feature => {
  return {
    type: Constants.geojsonTypes.FEATURE as 'Feature',
    properties: {
      meta: Constants.meta.VERTEX,
      parent: parentId,
      coord_path: path,
      active: selected
        ? Constants.activeStates.ACTIVE
        : Constants.activeStates.INACTIVE
    },
    geometry: {
      type: Constants.geojsonTypes.POINT as 'Point',
      coordinates
    }
  };
}
