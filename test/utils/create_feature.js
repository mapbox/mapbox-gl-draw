import getGeoJSON from './get_geojson.js';

export default function createFeature(featureType) {
  const feature = Object.assign({
    id: crypto.randomUUID(),
    properties: {}
  }, getGeoJSON(featureType));
  feature.toGeoJSON = () => feature;
  feature.setProperty = (property, name) => { feature.properties[property] = name; };
  return feature;
}
