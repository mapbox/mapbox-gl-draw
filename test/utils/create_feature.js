import { generateID } from '../../src/lib/id.js';
import getGeoJSON from './get_geojson.js';

const usedIds = new Set();

export function generateUniqueID() {
  let id = generateID();
  while (usedIds.has(id)) {
    id = generateID();
  }
  usedIds.add(id);
  return id;
}

export default function createFeature(featureType) {
  const feature = Object.assign(
    {
      id: generateUniqueID(),
      properties: {}
    },
    getGeoJSON(featureType)
  );
  feature.toGeoJSON = () => feature;
  feature.setProperty = (property, name) => {
    feature.properties[property] = name;
  };
  return feature;
}
